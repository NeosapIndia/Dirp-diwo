import {
  Component,
  Input,
  OnChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { AppService } from 'src/app/app.service';
import { ActivatedRoute } from '@angular/router';

declare var pipwerks: any;

@Component({
  selector: 'app-scorm-player',
  templateUrl: './scorm-player.component.html',
  styleUrls: ['./scorm-player.component.scss'],
})
export class ScormPlayerComponent
  implements OnChanges, AfterViewChecked, AfterViewInit, OnDestroy
{
  @Input() scormSrc!: string;
  @ViewChild('scormIframe') iframeRef!: ElementRef;

  sanitizedSrc: SafeResourceUrl | undefined;
  scormData: { [key: string]: any } = {};
  workbookId!: number;
  learnerId!: number;
  sessionUserID!: number;

  loading: boolean = true;

  private interactionSaveTimeout: any;
  private hasIframeInitialized = false;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    public appService: AppService,
    public route: ActivatedRoute
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.setIframeHeight();
      window.addEventListener('resize', this.setIframeHeight.bind(this));
    }, 100);
  }

  setIframeHeight() {
    const vh = window.innerHeight - 43;
    if (this.iframeRef?.nativeElement) {
      this.iframeRef.nativeElement.style.height = `${vh}px`;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loading = true;
    this.hasIframeInitialized = false;

    if (changes['scormSrc'] && changes['scormSrc'].currentValue) {
      this.workbookId = this.appService.moduleId;
      this.sessionUserID = Number(this.appService.sessionUserID);

      this.appService
        .getScormWorkbookData(this.workbookId, this.sessionUserID)
        .subscribe((res: any) => {
          // if (res?.scormData) {
          //   this.scormData = res.scormData;
          // }

          if (res?.scormData) {
            this.scormData = {
              ...res.scormData,
              'cmi.core.lesson_location': res.scormData['cmi.core.lesson_location'] || res.scormData['cmi.lesson_location'] || '',
              'cmi.core.lesson_status': res.scormData['cmi.core.lesson_status'] || res.scormData['cmi.lesson_status'] || '',
              'cmi.suspend_data': res.scormData['cmi.suspend_data'] || '',
            };
          }


          (window as any).API = this.createScorm12API();
          (window as any).API_1484_11 = this.createScorm2004API();
          console.log('✅ SCORM APIs injected into window');

          this.sanitizedSrc = undefined;
          setTimeout(() => {
            this.sanitizedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
              this.scormSrc
            );
          }, 100);
        });
    }
  }

  ngAfterViewChecked(): void {
    if (!this.hasIframeInitialized && this.iframeRef?.nativeElement) {
      this.hasIframeInitialized = true;
      const iframeEl = this.iframeRef.nativeElement as HTMLIFrameElement;

      setTimeout(() => {
        try {
          if (iframeEl.contentWindow) {
            this.injectAPIIntoIframe(iframeEl);
            console.log('✅ SCORM API injected early before content runs');
          } else {
            console.warn('⚠️ iframe.contentWindow not ready yet.');
          }
        } catch (err) {
          console.error('❌ Error injecting SCORM API early:', err);
        }
      }, 100);

      setTimeout(() => {
        if (this.loading) {
          console.warn('⚠️ Fallback: Iframe did not load in time');
          this.loading = false;
        }
      }, 10000);

      iframeEl.onload = () => {
        console.log('✅ Iframe loaded successfully.');
        this.setIframeHeight();
        this.initializeSCORM();
        this.loading = false;
      };

      window.addEventListener('message', this.handleScormMessage);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleScormMessage);
  }

  handleScormMessage = (event: any) => {
    if (event.data?.type === 'SCORM_COMMIT') {
      console.log('📩 Received SCORM data from iframe:', event.data.data);
      this.scormData = event.data.data;
      this.saveScormData();
    }
  };

  injectAPIIntoIframe(iframe: HTMLIFrameElement): void {
    const iframeWindow = iframe.contentWindow;

    if (!iframeWindow) {
      console.error("Couldn't access iframe window");
      return;
    }

    (iframeWindow as any).API = this.createScorm12API();
    (iframeWindow as any).API_1484_11 = this.createScorm2004API();

    console.log('✅ SCORM APIs injected into iframe');
  }

  createScorm12API() {
    return {
      LMSInitialize: () => {
        console.log('SCORM 1.2 LMSInitialize called');
        return 'true';
      },
      LMSFinish: () => {
        console.log('SCORM 1.2 LMSFinish called');
        this.saveScormData();
        return 'true';
      },
      LMSGetValue: (param: string) => {
        console.log('SCORM 1.2 LMSGetValue called with', param);
        return this.scormData[param] || '';
      },
      LMSSetValue: (param: string, value: any) => {
        console.log('SCORM 1.2 LMSSetValue called with', param, value);

        this.scormData[param] = value;

        if (/^cmi\.interactions\.\d+\.id$/.test(param)) {
          clearTimeout(this.interactionSaveTimeout);
          this.interactionSaveTimeout = setTimeout(() => {
            console.log('Debounced SCORM 1.2 save triggered');
            this.saveScormData();
          }, 500);
        }

        return 'true';
      },
      LMSCommit: () => {
        console.log('SCORM 1.2 LMSCommit called');
        this.saveScormData();
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => '',
      LMSGetDiagnostic: () => '',
    };
  }

  createScorm2004API() {
    return {
      Initialize: () => {
        console.log('SCORM 2004 Initialize called');
        return 'true';
      },
      Terminate: () => {
        console.log('SCORM 2004 Terminate called');
        this.saveScormData();
        return 'true';
      },
      GetValue: (param: string) => {
        console.log('SCORM 2004 GetValue called with', param);
        return this.scormData[param] || '';
      },
      SetValue: (param: string, value: any) => {
        console.log('SCORM 2004 SetValue called with', param, value);
        this.scormData[param] = value;

        if (/^cmi\.interactions\.\d+\.id$/.test(param)) {
          clearTimeout(this.interactionSaveTimeout);
          this.interactionSaveTimeout = setTimeout(() => {
            console.log('Debounced SCORM 2004 save triggered');
            this.saveScormData();
          }, 500);
        }

        return 'true';
      },
      Commit: () => {
        console.log('SCORM 2004 Commit called');
        this.saveScormData();
        return 'true';
      },
      GetLastError: () => '0',
      GetErrorString: () => '',
      GetDiagnostic: () => '',
    };
  }

  saveScormData() {
    this.workbookId = this.appService.moduleId;
    this.learnerId = Number(this.appService.learnerId);
    this.sessionUserID = Number(this.appService.sessionUserID);

    const scormPayload = {
      learner_id: this.learnerId,
      WorkbookId: this.workbookId,
      sessionUser: this.sessionUserID,
      scormData: this.scormData,
      // launch_time: new Date().toISOString(),
      initialLaunchDate : this.appService.initialLaunchDate,
      recentLaunchDate : this.appService.recentLaunchDate
    };

    console.log('Saving SCORM Data:', scormPayload);

    this.appService.saveScormWorkbookData(scormPayload).subscribe(
      (res: any) => {
        if (res.success) {
          console.log('Success:', res.success);
        }
      },
      (error) => {
        console.error('❌ Failed to save SCORM data:', error);
      }
    );
  }

  initializeSCORM(): void {
    if (pipwerks?.SCORM?.init()) {
      console.log('SCORM Initialized');
      pipwerks.SCORM.save();
    } else {
      console.error('SCORM init failed.');
    }
  }
}
