import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UtilsModule } from '../utils/utils.module';
import { PostCardComponent } from './post-card/post-card.component';
import { VimeoVideoComponent } from './vimeo-video/vimeo-video.component';
import { YoutubeVideoComponent } from './youtube-video/youtube-video.component';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { CMSVideoComponent } from './cms-video/cms-video.component';
import '@mux/mux-player';
@NgModule({
	declarations: [PostCardComponent, VimeoVideoComponent, YoutubeVideoComponent, CMSVideoComponent],
	imports: [CommonModule, IonicModule.forRoot(), UtilsModule, YouTubePlayerModule],
	exports: [PostCardComponent, VimeoVideoComponent, YoutubeVideoComponent, CMSVideoComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComponentsModule {}
