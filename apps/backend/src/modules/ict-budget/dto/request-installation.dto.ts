import { IsString, IsDateString } from 'class-validator';

export class RequestInstallationDto {
    @IsDateString()
    date: string;

    @IsString()
    timeSlot: string;
}
