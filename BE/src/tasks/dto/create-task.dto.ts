import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Project ID là bắt buộc' })
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsArray()
  assignees?: string[];

  @IsOptional()
  @IsArray()
  watchers?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @IsOptional()
  tags?: any;

  @IsOptional()
  @IsArray()
  subtasks?: any[];

  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
