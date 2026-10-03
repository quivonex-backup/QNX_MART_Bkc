// import { Injectable } from '@angular/core';
// import Swal from 'sweetalert2';

// @Injectable({
//   providedIn: 'root'
// })
// export class AlertService {

//   constructor() {}

//   info(message: any) {
//     return Swal.fire({
//       icon: 'info',
//       text: String(message),
//       confirmButtonText: 'OK'
//     });
//   }

//   success(message: any): Promise<any> {
//     return Swal.fire({
//       icon: 'success',
//       text: String(message),
//       confirmButtonText: 'OK',
//       confirmButtonColor: '#28a745',
//       heightAuto: false
//     });
//   }

//   error(message: any): Promise<any> {
//     return Swal.fire({
//       icon: 'error',
//       text: String(message),
//       confirmButtonText: 'OK',
//       confirmButtonColor: '#dc3545',
//       heightAuto: false
//     });
//   }

//   warning(message: any): Promise<any> {
//     return Swal.fire({
//       icon: 'warning',
//       text: String(message),
//       confirmButtonText: 'OK',
//       confirmButtonColor: '#ffc107',
//       heightAuto: false
//     });
//   }
// }



// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class AlertService {

//   private alertBox: HTMLElement | null = null;

//   constructor() {}

//   unialert(message: string): void {

//     // Remove existing alert if already open
//     if (this.alertBox) {
//       this.alertBox.remove();
//     }

//     const overlay = document.createElement('div');

//     overlay.style.position = 'fixed';
//     overlay.style.top = '0';
//     overlay.style.left = '0';
//     overlay.style.width = '100%';
//     overlay.style.height = '100%';
//     overlay.style.background = 'rgba(0,0,0,0.45)';
//     overlay.style.display = 'flex';
//     overlay.style.justifyContent = 'center';
//     overlay.style.alignItems = 'center';
//     overlay.style.zIndex = '999999';

//     const popup = document.createElement('div');

//     popup.style.width = '90%';
//     popup.style.maxWidth = '380px';
//     popup.style.background = '#fff';
//     popup.style.borderRadius = '12px';
//     popup.style.padding = '24px';
//     popup.style.boxShadow = '0 15px 40px rgba(0,0,0,.3)';
//     popup.style.textAlign = 'center';
//     popup.style.fontFamily = 'Arial, sans-serif';

//     // const title = document.createElement('h3');
//     // title.innerText = 'Notification';
//     // title.style.margin = '0 0 15px';
//     // title.style.color = '#333';

//     const msg = document.createElement('p');
//     msg.innerText = message;
//     msg.style.marginBottom = '20px';
//     msg.style.color = '#555';
//     msg.style.wordBreak = 'break-word';

//     const btn = document.createElement('button');
//     btn.innerText = 'OK';
//     btn.style.padding = '8px 20px';
//     btn.style.border = 'none';
//     btn.style.borderRadius = '4px';
//     btn.style.background = '#1976d2';
//     btn.style.color = '#fff';
//     btn.style.fontSize = '12px';
//     btn.style.cursor = 'pointer';

//     btn.onclick = () => {
//       overlay.remove();
//       this.alertBox = null;
//     };

//     overlay.onclick = (e: MouseEvent) => {
//       if (e.target === overlay) {
//         overlay.remove();
//         this.alertBox = null;
//       }
//     };

//     // popup.appendChild(title);
//     popup.appendChild(msg);
//     popup.appendChild(btn);

//     overlay.appendChild(popup);

//     document.body.appendChild(overlay);

//     this.alertBox = overlay;
//   }
// }








// alert.service.ts
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    private alertBox: HTMLElement | null = null;

    constructor() {
        this.injectStyles();
    }

    // ---- Simple alert (OK only) ----
    unialert(message: string, p0?: string): void {
        this.removeExisting();

        const overlay = this.createOverlay();
        const popup = this.createPopup();

        // Icon
        const iconWrap = document.createElement('div');
        iconWrap.className = 'uni-alert-icon';
        iconWrap.textContent = 'i';
        popup.appendChild(iconWrap);

        // Message
        const msg = document.createElement('p');
        msg.className = 'uni-alert-message';
        msg.textContent = message;
        popup.appendChild(msg);

        // OK button
        const btn = document.createElement('button');
        btn.className = 'uni-alert-button';
        btn.textContent = 'OK';
        popup.appendChild(btn);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        this.alertBox = overlay;
        document.body.style.overflow = 'hidden';

        const close = () => {
            overlay.remove();
            this.alertBox = null;
            document.body.style.overflow = '';
        };

        btn.onclick = close;
        overlay.onclick = (e: MouseEvent) => {
            if (e.target === overlay) close();
        };
    }

    // ---- Confirm with Yes/No (returns Promise<boolean>) ----
    uniConfirm(message: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.removeExisting();

            const overlay = this.createOverlay();
            const popup = this.createPopup();

            // Icon
            const iconWrap = document.createElement('div');
            iconWrap.className = 'uni-alert-icon';
            iconWrap.textContent = '?';
            popup.appendChild(iconWrap);

            // Message
            const msg = document.createElement('p');
            msg.className = 'uni-alert-message';
            msg.textContent = message;
            popup.appendChild(msg);

            // Buttons container
            const btnWrap = document.createElement('div');
            btnWrap.className = 'uni-confirm-buttons';

            // Yes button
            const yesBtn = document.createElement('button');
            yesBtn.className = 'uni-alert-button yes';
            yesBtn.textContent = 'Yes';
            btnWrap.appendChild(yesBtn);

            // No button
            const noBtn = document.createElement('button');
            noBtn.className = 'uni-alert-button no';
            noBtn.textContent = 'No';
            btnWrap.appendChild(noBtn);

            popup.appendChild(btnWrap);

            overlay.appendChild(popup);
            document.body.appendChild(overlay);
            this.alertBox = overlay;
            document.body.style.overflow = 'hidden';

            const close = (result: boolean) => {
                overlay.remove();
                this.alertBox = null;
                document.body.style.overflow = '';
                resolve(result);
            };

            yesBtn.onclick = () => close(true);
            noBtn.onclick = () => close(false);
            overlay.onclick = (e: MouseEvent) => {
                if (e.target === overlay) close(false);
            };
        });
    }

    // ---- Helpers ----
    private removeExisting(): void {
        if (this.alertBox) {
            this.alertBox.remove();
            this.alertBox = null;
            document.body.style.overflow = '';
        }
    }

    private createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'uni-alert-overlay';
        return overlay;
    }

    private createPopup(): HTMLElement {
        const popup = document.createElement('div');
        popup.className = 'uni-alert-popup';
        return popup;
    }

    private injectStyles(): void {
        if (document.querySelector('#uni-alert-styles')) return;

        const style = document.createElement('style');
        style.id = 'uni-alert-styles';
        style.textContent = `
            /* ----- Overlay ----- */
            .uni-alert-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.55);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                animation: uniFadeIn 0.25s ease-out;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                padding: 20px;
                box-sizing: border-box;
            }

            .uni-alert-popup {
                background: #ffffff;
                border-radius: 28px;
                padding: 40px 32px 32px;
                max-width: 420px;
                width: 100%;
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                animation: uniSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                overflow: hidden;
            }
            .uni-alert-popup::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa);
                border-radius: 28px 28px 0 0;
            }

            .uni-alert-icon {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #f0f4ff, #e8edff);
                color: #4f46e5;
                font-size: 28px;
                font-weight: 600;
                line-height: 56px;
                text-align: center;
                margin: 0 auto 18px;
                font-family: 'Georgia', serif;
                box-shadow: 0 8px 20px rgba(79, 70, 229, 0.15);
                user-select: none;
            }

            .uni-alert-message {
                margin: 0 0 28px 0;
                font-size: 17px;
                line-height: 1.6;
                color: #1e293b;
                font-weight: 450;
                letter-spacing: -0.01em;
                word-break: break-word;
            }

            /* Buttons */
            .uni-alert-button {
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                border: none;
                border-radius: 50px;
                padding: 14px 40px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 120px;
                letter-spacing: 0.4px;
                box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3);
            }
            .uni-alert-button:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
                background: linear-gradient(135deg, #4338ca, #6d28d9);
            }
            .uni-alert-button:active {
                transform: scale(0.96);
            }

            .uni-confirm-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .uni-confirm-buttons .uni-alert-button {
                min-width: 100px;
                padding: 12px 24px;
            }
            .uni-confirm-buttons .uni-alert-button.yes {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
            }
            .uni-confirm-buttons .uni-alert-button.yes:hover {
                background: linear-gradient(135deg, #16a34a, #15803d);
                box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
            }
            .uni-confirm-buttons .uni-alert-button.no {
                background: #f1f4f9;
                color: #475569;
                box-shadow: none;
            }
            .uni-confirm-buttons .uni-alert-button.no:hover {
                background: #e2e8f0;
                transform: translateY(-2px);
            }

            @keyframes uniFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes uniSlideUp {
                from { opacity: 0; transform: translateY(30px) scale(0.94); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            @media (max-width: 480px) {
                .uni-alert-popup { padding: 32px 20px 24px; }
                .uni-alert-icon { width: 48px; height: 48px; font-size: 24px; line-height: 48px; }
                .uni-alert-message { font-size: 16px; }
                .uni-alert-button { padding: 12px 32px; font-size: 15px; min-width: 100px; }
                .uni-confirm-buttons .uni-alert-button { min-width: 80px; padding: 10px 20px; }
            }
        `;
        document.head.appendChild(style);
    }
}