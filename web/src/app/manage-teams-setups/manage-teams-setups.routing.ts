import { Routes } from "@angular/router";
import { AddEditTeamSetupsComponent } from "./add-edit-teams-setups/add-edit-teams-setups.component";
import { ManageTeamSetupComponent } from "./manage-teams-setups.component";

export const ManageTeamSetupRoutes: Routes = [
  { path: "", component: ManageTeamSetupComponent },
  {
    path: "add-or-edit-teams-setup",
    component: AddEditTeamSetupsComponent,
  },
];
