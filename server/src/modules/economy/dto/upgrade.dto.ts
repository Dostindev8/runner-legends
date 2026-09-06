import { IsIn } from 'class-validator';
import type { UpgradeBranch } from '../../../shared/upgrade-tables';

export class UpgradeDto {
  @IsIn(['speed', 'comboPower', 'superRecharge'])
  branch!: UpgradeBranch;
}
