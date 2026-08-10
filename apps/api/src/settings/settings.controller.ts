import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  getPublic() {
    return this.settingsService.getPublicPageSettings();
  }

  @Get()
  @ApiBearerAuth()
  @Roles('Admin')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiBearerAuth()
  @Roles('Admin')
  updateSettings(
    @Body()
    body: {
      activeAppointment?: boolean;
      appointmentType?: string;
      companyName?: string | null;
      mailContact?: string | null;
      location?: string | null;
      address?: string | null;
      phone?: string | null;
      currencySymbol?: string;
      whatsapp?: string | null;
      instagramHref?: string | null;
      embeddedContentMap?: string | null;
      logo?: string;
      banner?: string;
      aboutUs?: string | null;
      schedules?: string | null;
      imageLeft?: string;
      imageRight?: string;
      imageParallax?: string;
      buttonsBackgroundColor?: string;
      buttonsTextColor?: string;
      iconsColor?: string;
      titlesColor?: string;
      footerBackgroundColor?: string;
      footerTextColor?: string;
      btnWhatsappBackgroundColor?: string;
      btnWhatsappTextColor?: string;
    },
  ) {
    return this.settingsService.updateSetting(body);
  }

  @Patch('sections')
  @ApiBearerAuth()
  @Roles('Admin')
  @UseGuards(FeatureGuard)
  @RequireFeature('sections')
  updateSections(
    @Body()
    body: {
      aboutUsShowSection?: boolean;
      aboutUsText?: string;
      aboutUsIcon?: string;
      employeesShowSection?: boolean;
      employeesText?: string;
      employeesIcon?: string;
      servicesShowSection?: boolean;
      servicesText?: string;
      servicesIcon?: string;
      productsShowSection?: boolean;
      productsText?: string;
      productsIcon?: string;
      instagramShowSection?: boolean;
      instagramText?: string;
      instagramIcon?: string;
      whatsappShowSection?: boolean;
      whatsappTitle1?: string;
      whatsappTitle2?: string;
      whatsappTitle3?: string;
      whatsappIcon?: string;
      btnWhatsappButtonText?: string;
    },
  ) {
    return this.settingsService.updateSections(body);
  }

  @Post('upload')
  @ApiBearerAuth()
  @Roles('Admin')
  uploadSettingImage(@Body() body: { field: string; filename: string }) {
    return this.settingsService.uploadSettingImage(body.field, body.filename);
  }
}
