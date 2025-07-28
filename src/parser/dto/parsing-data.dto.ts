import { UrlHostDto } from '../../urls/dto/url-host.dto';
import { ClassNamesDto } from './class-names.dto';
import { IntersectionType } from '@nestjs/mapped-types';

export class ParsingDataDto extends IntersectionType(
  UrlHostDto,
  ClassNamesDto,
) {}
