import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  taskId!: string;
}
