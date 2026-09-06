#nullable enable
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace RunnerLegends.Infrastructure.Save
{
    /// <summary>
    /// Local JSON save with AES-at-rest (GDD 4.2 SaveSystem). Encryption here protects
    /// integrity/casual tampering of the local file; it is NOT the anti-cheat authority —
    /// that is always the server (tournament-service validation). Deferred cloud sync is
    /// layered on top by the networking module.
    /// </summary>
    public sealed class JsonSaveSystem : ISaveSystem
    {
        private readonly string _root;
        private readonly byte[] _key; // 32 bytes
        private readonly byte[] _iv;  // 16 bytes

        public JsonSaveSystem(string deviceSecret)
        {
            _root = Application.persistentDataPath;
            using var sha = SHA256.Create();
            _key = sha.ComputeHash(Encoding.UTF8.GetBytes(deviceSecret + ":rl-save-v1"));
            var ivHash = sha.ComputeHash(Encoding.UTF8.GetBytes(deviceSecret + ":iv"));
            _iv = new byte[16];
            Array.Copy(ivHash, _iv, 16);
        }

        private string PathFor(string key) => System.IO.Path.Combine(_root, key + ".sav");

        public bool Exists(string key) => File.Exists(PathFor(key));
        public void Delete(string key) { var p = PathFor(key); if (File.Exists(p)) File.Delete(p); }

        public void Save<T>(string key, T data) where T : class
        {
            string json = JsonUtility.ToJson(data);
            byte[] cipher = Encrypt(Encoding.UTF8.GetBytes(json));
            File.WriteAllBytes(PathFor(key), cipher);
        }

        public T? Load<T>(string key) where T : class
        {
            var p = PathFor(key);
            if (!File.Exists(p)) return null;
            try
            {
                byte[] plain = Decrypt(File.ReadAllBytes(p));
                return JsonUtility.FromJson<T>(Encoding.UTF8.GetString(plain));
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Save] Corrupt/incompatible save '{key}': {e.Message}. Ignoring.");
                return null;
            }
        }

        private byte[] Encrypt(byte[] data)
        {
            using var aes = Aes.Create();
            aes.Key = _key; aes.IV = _iv;
            using var enc = aes.CreateEncryptor();
            return enc.TransformFinalBlock(data, 0, data.Length);
        }

        private byte[] Decrypt(byte[] data)
        {
            using var aes = Aes.Create();
            aes.Key = _key; aes.IV = _iv;
            using var dec = aes.CreateDecryptor();
            return dec.TransformFinalBlock(data, 0, data.Length);
        }
    }
}
