import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class CommentMentionDto {
  @IsMongoId()
  user!: string;

  @IsNumber()
  @Min(0)
  offset!: number;

  @IsNumber()
  @Min(1)
  length!: number;
}

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentMentionDto)
  mentions?: CommentMentionDto[];

  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;

  @IsNotEmpty()
  @IsString()
  taskId!: string;
}
