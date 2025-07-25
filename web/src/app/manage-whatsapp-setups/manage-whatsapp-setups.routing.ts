import { Routes } from '@angular/router';
import { AddEditWhatsAppSetupsComponent } from './add-edit-whatsapp-setups/add-edit-whatsapp-setups.component';
import { ManageWhatsAppSetupComponent } from './manage-whatsapp-setups.component';

export const ManageWhatsAppSetupRoutes: Routes = [
  { path: '', component: ManageWhatsAppSetupComponent },
  { path: 'add-or-edit-whatsapp-setup', component: AddEditWhatsAppSetupsComponent },
];
