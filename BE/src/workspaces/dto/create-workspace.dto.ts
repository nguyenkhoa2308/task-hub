import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateWorkspaceDto {
    @IsString({ message: "Tên không hợp lệ" })
    @IsNotEmpty({ message: "Tên không được để trống" })
    @MinLength(3, { message: "Tên phải có ít nhất 3 ký tự" })
    name!: string;

    @IsString({ message: "Mô tả không hợp lệ" })
    @IsOptional()
    description?: string;

    @IsString({ message: "Màu sắc không hợp lệ" })
    @IsNotEmpty({ message: "Màu sắc không được để trống" })
    @MinLength(3, { message: "Màu sắc phải có ít nhất 3 ký tự" })
    color!: string;

    @IsOptional()
    @IsBoolean()
    allowMembersCreateProjects?: boolean;

    @IsOptional()
    @IsBoolean()
    allowMembersInvite?: boolean;

    @IsOptional()
    @IsBoolean()
    defaultProjectPrivate?: boolean;
}
