import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserPlan } from '../../common/enums/user-plan.enum';

export class AnalyzeUrlDto {
  @IsNotEmpty()
  @IsString()
  readonly url: string;

  @IsEnum(UserPlan)
  readonly plan_id: UserPlan;
}
