import { Component, OnInit, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import { ManageAssetsLibraryService } from 'src/app/manage-assets-library/manage-assets-library.service';
import { ManageLearnerGroupsService } from 'src/app/manage-learner-groups/manage-learner-groups.service';
import { ManagePostsLibraryService } from 'src/app/manage-posts-library/manage-posts-library.service';
import { ManageDripFlowsService } from '../manage-drip-flow.service';
declare var $: any;
import * as moment from 'moment';

@Component({
	selector: 'app-add-edit-drip-flow',
	templateUrl: './add-edit-drip-flow.component.html',
	styleUrls: ['./add-edit-drip-flow.component.css'],
})
export class AddEditDripFlowComponent implements OnInit, AfterViewChecked {
	isSendGridEmail: boolean = false;
	haveTeamSetup: boolean = false;
	canAddMoreDrip: boolean = true;
	notOwnAnyAssetRoleId = [2, 3, 4, 5];
	client_List = [];
	ownUserRoleList = [
		{ RoleId: 6, name: 'Client Admin' },
		{ RoleId: 7, name: 'Branch Admin' },
	];
	dripFlowDetailsForm: FormGroup;
	dripFlowDripForm: FormGroup;
	postForm: FormGroup;
	payloadData: any = [];
	postData: any;
	writePermission: boolean = false;
	index: any;
	selecteddripTriggerDate = null;
	selecteddripActionDate = null;
	selectedStartOnDate = null;
	selectedendOnDate = null;
	dependancyDrip = null;
	settings = {
		bigBanner: false,
		timePicker: false,
		format: 'dd/MM/yyyy',
		defaultOpen: false,
		closeOnSelect: true,
	};
	learnerGroupList: any = [];
	customDateFieldsList: any = [];
	quickReplayList = [];
	questionList = [];
	campChannelMappingList = [];
	drip_trigger_ruleList = [
		{ name: 'Send on date', label: 'Send on a given date' },
		{ name: 'Send based on system activity', label: 'Send based on system activity' },
		{ name: 'Send based on user activity', label: 'Send based on contact activity' },
	];

	drip_trigger_rule_List_without_user_base_activity = [
		{ name: 'Send on date', label: 'Send on a given date' },
		{ name: 'Send based on system activity', label: 'Send based on system activity' },
	];

	drip_trigger_ruleList2 = [
		{ name: 'Send on drip flow start date', label: 'Send based on Drip Flow start date' },
		{ name: 'Send based on system activity', label: 'Send based on system activity' },
		{ name: 'Send based on user activity', label: 'Send based on contact activity' },
	];

	drip_trigger_rule_List_without_user_base_activity2 = [
		{ name: 'Send on drip flow start date', label: 'Send based on Drip Flow start date' },
		{ name: 'Send based on system activity', label: 'Send based on system activity' },
	];

	drip_trigger_rule_List_for_channel = [{ name: 'Send on date', label: 'Send on a given date' }];

	drip_system_action_type = [
		{ name: 'Based on drip sent' },
		{ name: 'Based on previous action taken' },
		{ name: 'Based on tags added' },
	];

	drip_system_action_type_only_tag = [{ name: 'Based on tags added' }];
	drip_system_action_type_only_tag_with_ticket_comment = [
		{ name: 'Based on tags added' },
		{ name: 'When ticket comment is updated' },
	];

	drip_system_action_type_with_tag_drip = [{ name: 'Based on drip sent' }, { name: 'Based on tags added' }];
	drip_system_action_type_with_tag_drip_with_ticket_comment = [
		{ name: 'Based on drip sent' },
		{ name: 'Based on tags added' },
		{ name: 'When ticket comment is updated' },
	];

	drip_system_action_type_with_tag_action = [
		{ name: 'Based on previous action taken' },
		{ name: 'Based on tags added' },
	];

	take_action_system_action_type = [
		{ name: 'Based on drip sent' },
		{ name: 'Based on previous action taken' },
		{ name: 'Based on tags added' },
	];

	take_action_system_action_type_only_tag = [{ name: 'Based on tags added' }];

	take_action_system_action_type_with_tag_drip = [{ name: 'Based on drip sent' }, { name: 'Based on tags added' }];

	take_action_system_action_type_with_tag_action = [
		{ name: 'Based on previous action taken' },
		{ name: 'Based on tags added' },
	];

	action_trigger_ruleList = [
		{ name: 'Take action on date', label: 'Take action on date' },
		{ name: 'Take action based on system activity', label: 'Take action based on system activity' },
		{ name: 'Take action based on user activity', label: 'Take action based on contact activity' },
	];
	action_trigger_ruleList_without_user_base_activity = [
		{ name: 'Take action on date', label: 'Take action on date' },
		{ name: 'Take action based on system activity', label: 'Take action based on system activity' },
	];

	action_trigger_ruleList2 = [
		{ name: 'Take action on drip flow start date', label: 'Take action based on Drip Flow start date' },
		{ name: 'Take action based on system activity', label: 'Take action based on system activity' },
		{ name: 'Take action based on user activity', label: 'Take action based on contact activity' },
	];

	action_trigger_ruleList_without_user_base_activity2 = [
		{ name: 'Take action on drip flow start date', label: 'Take action based on Drip Flow start date' },
		{ name: 'Take action based on system activity', label: 'Take action based on system activity' },
	];

	action_type_list = [
		{ name: 'Unlicense learner', label: 'Unlicense contact' },
		{ name: 'Add to group', label: 'Add to group' },
		{ name: 'Delete from group', label: 'Delete from group' },
		{ name: 'Add Tag', label: 'Add tag' },
		{ name: 'Delete Tag', label: 'Delete tag' },
	];

	// user_action_type = [
	// 	{ name: 'Read', label: 'Learner has read' },
	// 	{ name: 'Link click', label: 'Learner has clicked WhatsApp link' },
	// 	{ name: 'CTA response', label: 'Learner responded to CTA' },
	// 	{ name: 'Drip click action', label: 'Learner has taken action in Drip App' },
	// 	{ name: 'Activity score', label: 'Activity score' },
	// ];
	// user_action_type_without_activity_score = [
	// 	{ name: 'Read', label: 'Learner has read' },
	// 	{ name: 'Link click', label: 'Learner has clicked WhatsApp link' },
	// 	{ name: 'CTA response', label: 'Learner responded to CTA' },
	// 	{ name: 'Drip click action', label: 'Learner has taken action in Drip App' },
	// ];

	user_action_type_list = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
		{ name: 'Activity Outcome', label: 'Contact has achieved a certain activity outcome' },
	];

	user_action_type_list2 = [];

	user_action_type_list_without_activity_score = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
	];

	user_action_type_list_for_image_drip = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
	];
	user_action_type_list_for_image_drip2 = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
	];

	user_action_type_list_for_image_drip2_for_teams_with_drip_app = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
	];

	user_action_type = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
		{ name: 'Activity Outcome', label: 'Contact has achieved a certain activity outcome' },
	];

	user_action_type_for_teams_with_drip_app = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
		{ name: 'Activity Outcome', label: 'Contact has achieved a certain activity outcome' },
	];

	user_action_type_without_activity_score = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
	];

	user_action_type_without_activity_score_for_teams_with_drip_app = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App' },
		{ name: 'Drip Action taken', label: 'contact has displayed action intent on Drip App' },
		{ name: 'Drip Action not taken', label: 'contact has not displayed action intent on Drip App' },
		{ name: 'Drip submit Action taken', label: 'Contact has taken action on Drip App' },
		{ name: 'Drip submit Action not taken', label: 'Contact has not taken action on Drip App' },
	];

	user_action_type2 = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Activity Outcome', label: 'Contact has achieved a certain activity outcome' },
	];

	user_action_type_with_external_link = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Read on drip app', label: 'Contact has read on Drip App/External Source' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App/External Source' },
		{ name: 'Activity Outcome', label: 'Contact has achieved a certain activity outcome' },
	];

	user_action_type_with_external_link_for_only_teams = [
		{ name: 'Read on drip app', label: 'Contact has read on Drip App/External Source' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App/External Source' },
	];

	user_action_type_without_activity_score2 = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
	];

	user_action_type_with_external_link_without_activity_score2 = [
		{ name: 'Read on channel', label: 'Contact has read on the everyday channel' },
		{ name: 'Not read on channel', label: 'Contact has not read on the everyday channel' },
		{ name: 'Read on drip app', label: 'Contact has read on Drip App/External Source' },
		{ name: 'Not read on drip app', label: 'Contact has not read on Drip App/External Source' },
	];

	dripTypeList = [
		{ name: 'Only WhatsApp', label: 'Only WhatsApp', type: 1 },
		{ name: 'DripApp with sharing on WhatsApp', label: 'Drip App with sharing on WhatsApp', type: 2 },
		{ name: 'Only Email', label: 'Only Email', type: 7 },
		{ name: 'DripApp with sharing on Email', label: 'Drip App with sharing on Email', type: 3 },
		{ name: 'Only DripApp', label: 'Only Drip App', type: 4 },
		{ name: 'Only Teams', label: 'Only Microsoft Teams', type: 5 },
		{ name: 'DripApp with sharing on Teams', label: 'Drip App with sharing on Microsoft Teams', type: 6 },
	];

	dripTypeListWithoutTeam = [
		{ name: 'Only WhatsApp', label: 'Only WhatsApp', type: 1 },
		{ name: 'DripApp with sharing on WhatsApp', label: 'Drip App with sharing on WhatsApp', type: 2 },
		{ name: 'Only Email', label: 'Only Email', type: 7 },
		{ name: 'DripApp with sharing on Email', label: 'Drip App with sharing on Email', type: 3 },
		{ name: 'Only DripApp', label: 'Only Drip App', type: 4 },
	];

	dripTypeListForChannel = [{ name: 'Only Teams', label: 'Only Microsoft Teams', type: 5 }];

	startRules = [
		{ name: 'Start on date', label: 'Start on a given date' },
		{ name: 'Start when learner is added to group', label: 'Start when contact is added to group' },
		{ name: 'Start when tag is added to learner', label: 'Start when tag is added to contact' },
	];

	startRulesForChannel = [{ name: 'Start on date', label: 'Start on a given date' }];

	startRulesForConversational = [
		{ name: 'Start when tag is added to learner', label: 'Start when tag is added to contact' },
	];

	// ////////Success Metrics//////////////////////
	successMetricsList = [];
	successMetricsForm: FormGroup;
	successMetricsDripList = [];
	metrics_list_for_empty = [];
	isPresentQuickReplay = false;
	isPresentExternalLink = false;
	///////////////////////////////////// For Mutiple Drip ////////////////////////////
	metrics_list_for_multiple_drip = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
	];

	///////////////////////////////////// For Learning Content ////////////////////////////

	//With External Link
	metrics_list_for_learning_content_with_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
	];

	//With External Link for drip with team
	metrics_list_for_learning_content_with_external_link_for_drip_with_team = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
	];

	//Without External Link
	metrics_list_for_learning_content_without_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
	];

	//Without External Link for drip with team
	metrics_list_for_learning_content_without_external_link_for_drip_with_team = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
	];

	///////////////////////////////////// For Carousal ////////////////////////////

	//With External Link
	metrics_list_for_carousal_with_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Swipe Intent on Carousal', label: 'Swipe Intent on Carousal' },
		{ name: 'Swipe Intent Rate', label: 'Swipe Intent Rate' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
		{ name: 'Average No. of Swipes', label: 'Average No. of Swipes' },
	];

	//With External Link For Drip with Teams
	metrics_list_for_carousal_with_external_link_for_drip_with = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Swipe Intent on Carousal', label: 'Swipe Intent on Carousal' },
		{ name: 'Swipe Intent Rate', label: 'Swipe Intent Rate' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
		{ name: 'Average No. of Swipes', label: 'Average No. of Swipes' },
	];

	//Without External Link
	metrics_list_for_carousal_without_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Swipe Intent on Carousal', label: 'Swipe Intent on Carousal' },
		{ name: 'Swipe Intent Rate', label: 'Swipe Intent Rate' },
		{ name: 'Average No. of Swipes', label: 'Average No. of Swipes' },
	];

	//Without External Link For Drip with Teams
	metrics_list_for_carousal_without_external_link_for_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Swipe Intent on Carousal', label: 'Swipe Intent on Carousal' },
		{ name: 'Swipe Intent Rate', label: 'Swipe Intent Rate' },
		{ name: 'Average No. of Swipes', label: 'Average No. of Swipes' },
	];
	///////////////////////////////////// For Quiz ////////////////////////////

	metrics_list_for_quiz = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Quiz Attempted', label: 'Quiz Attempted' },
		{ name: 'Quiz Attempt Rate', label: 'Quiz Attempt Rate' },
		{ name: 'Quiz Submitted', label: 'Quiz Submitted' },
		{ name: 'Quiz Submitted Rate', label: 'Quiz Submitted Rate' },
		{ name: 'Average Score', label: 'Average Score' },
		{
			name: 'Score is greater than/less than/equal to',
			label: 'Score is greater than/less than/equal to',
		},
	];

	//For With With Teams
	metrics_list_for_quiz_for_drip_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Quiz Attempted', label: 'Quiz Attempted' },
		{ name: 'Quiz Attempt Rate', label: 'Quiz Attempt Rate' },
		{ name: 'Quiz Submitted', label: 'Quiz Submitted' },
		{ name: 'Quiz Submitted Rate', label: 'Quiz Submitted Rate' },
		{ name: 'Average Score', label: 'Average Score' },
		{
			name: 'Score is greater than/less than/equal to',
			label: 'Score is greater than/less than/equal to',
		},
	];

	///////////////////////////////////// For Spin The Wheel ////////////////////////////

	metrics_list_for_spin_the_wheel = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Spin The Wheel Attempted', label: 'Spin The Wheel Attempted' },
		{ name: 'Spin The Wheel Attempt Rate', label: 'Spin The Wheel Attempt Rate' },
		{ name: 'Spin The Wheel Submitted', label: 'Spin The Wheel Submitted' },
		{ name: 'Spin The Wheel Submitted Rate', label: 'Spin The Wheel Submitted Rate' },
		{ name: 'Average Score', label: 'Average Score' },
		{
			name: 'Score is greater than/less than/equal to',
			label: 'Score is greater than/less than/equal to',
		},
	];

	//For With With Teams
	metrics_list_for_spin_the_wheel_for_drip_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Spin The Wheel Attempted', label: 'Spin The Wheel Attempted' },
		{ name: 'Spin The Wheel Attempt Rate', label: 'Spin The Wheel Attempt Rate' },
		{ name: 'Spin The Wheel Submitted', label: 'Spin The Wheel Submitted' },
		{ name: 'Spin The Wheel Submitted Rate', label: 'Spin The Wheel Submitted Rate' },
		{ name: 'Average Score', label: 'Average Score' },
		{
			name: 'Score is greater than/less than/equal to',
			label: 'Score is greater than/less than/equal to',
		},
	];

	///////////////////////////////////// For Video ////////////////////////////

	//With External Link
	metrics_list_for_video_with_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{
			name: 'Total Number of Video Plays',
			label: 'Total Number of Video Plays',
		},
		{ name: 'Video Play Rate', label: 'Video Play Rate' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
		{ name: 'Average Watch Time', label: 'Average Watch Time' },
		{
			name: 'Watched more than/less than',
			label: 'Watched more than/less than',
		},
	];

	//With External Link For Drip with Teams
	metrics_list_for_video_with_external_link_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{
			name: 'Total Number of Video Plays',
			label: 'Total Number of Video Plays',
		},
		{ name: 'Video Play Rate', label: 'Video Play Rate' },
		{ name: 'External Link Click', label: 'External Link Click' },
		{ name: 'External Link Click Rate', label: 'External Link Click Rate' },
		{ name: 'Average Watch Time', label: 'Average Watch Time' },
		{
			name: 'Watched more than/less than',
			label: 'Watched more than/less than',
		},
	];

	//Without External Link
	metrics_list_for_video_without_external_link = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{
			name: 'Total Number of Video Plays',
			label: 'Total Number of Video Plays',
		},
		{ name: 'Video Play Rate', label: 'Video Play Rate' },
		{ name: 'Average Watch Time', label: 'Average Watch Time' },
		{
			name: 'Watched more than/less than',
			label: 'Watched more than/less than',
		},
	];

	//Without External Link For Drip with Teams
	metrics_list_for_video_without_external_link_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{
			name: 'Total Number of Video Plays',
			label: 'Total Number of Video Plays',
		},
		{ name: 'Video Play Rate', label: 'Video Play Rate' },
		{ name: 'Average Watch Time', label: 'Average Watch Time' },
		{
			name: 'Watched more than/less than',
			label: 'Watched more than/less than',
		},
	];

	///////////////////////////////////// For Poll ////////////////////////////
	metrics_list_for_poll = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Poll Attempted', label: 'Poll Attempted' },
		{ name: 'Poll Attempt Rate', label: 'Poll Attempt Rate' },
		{ name: 'Poll Submitted', label: 'Poll Submitted' },
		{ name: 'Poll Submission Rate', label: 'Poll Submission Rate' },
		{ name: 'Option Selected', label: 'Option Selected' },
	];

	metrics_list_for_poll_for_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Poll Attempted', label: 'Poll Attempted' },
		{ name: 'Poll Attempt Rate', label: 'Poll Attempt Rate' },
		{ name: 'Poll Submitted', label: 'Poll Submitted' },
		{ name: 'Poll Submission Rate', label: 'Poll Submission Rate' },
		{ name: 'Option Selected', label: 'Option Selected' },
	];

	///////////////////////////////////// For Survey ////////////////////////////
	metrics_list_for_survey = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Survey Initiated', label: 'Survey Initiated' },
		{ name: 'Survey Inititated Rate', label: 'Survey Inititated Rate' },
		{ name: 'Survey Submitted', label: 'Survey Submitted' },
		{ name: 'Survey Submission Rate', label: 'Survey Submission Rate' },
		{ name: 'Option Selected', label: 'Option Selected' },
		{
			name: 'Rating is more than/less than/equal to',
			label: 'Rating is more than/less than/equal to',
		},
	];
	// For Drip with Teams
	metrics_list_for_survey_for_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Survey Initiated', label: 'Survey Initiated' },
		{ name: 'Survey Inititated Rate', label: 'Survey Inititated Rate' },
		{ name: 'Survey Submitted', label: 'Survey Submitted' },
		{ name: 'Survey Submission Rate', label: 'Survey Submission Rate' },
		{ name: 'Option Selected', label: 'Option Selected' },
		{
			name: 'Rating is more than/less than/equal to',
			label: 'Rating is more than/less than/equal to',
		},
	];

	///////////////////////////////////// For Offline Task ////////////////////////////
	metrics_list_for_offline_task = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Task Attempted', label: 'Task Attempted' },
		{ name: 'Task Attempted Rate', label: 'Task Attempted Rate' },
		{ name: 'Task Submitted', label: 'Task Submitted' },
		{ name: 'Task Submission Rate', label: 'Task Submission Rate' },
		{ name: 'Grade is', label: 'Grade is' },
	];

	// For Drip With Teams
	metrics_list_for_offline_task_for_drip_with_teams = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Read on Drip App', label: 'Read on Drip App' },
		{ name: 'Read Rate on Drip App', label: 'Read Rate on Drip App' },
		{ name: 'Task Attempted', label: 'Task Attempted' },
		{ name: 'Task Attempted Rate', label: 'Task Attempted Rate' },
		{ name: 'Task Submitted', label: 'Task Submitted' },
		{ name: 'Task Submission Rate', label: 'Task Submission Rate' },
		{ name: 'Grade is', label: 'Grade is' },
	];

	///////////////////////////////////// For Only WhatsApp ////////////////////////////
	//With Quick Reply and With ExternalSource
	metrics_list_for_Only_whatsapp_with_quick_reply_with_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{
			name: 'Read on Drip App/External Source',
			label: 'Read on Drip App/External Source',
		},
		{
			name: 'Read Rate on Drip App/External Source',
			label: 'Read Rate on Drip App/External Source',
		},
		{ name: 'Quick Reply Selected', label: 'Quick Reply Selected' },
	];

	//Without Quick Reply and With ExternalSource
	metrics_list_for_Only_whatsapp_without_quick_reply_with_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{
			name: 'Read on Drip App/External Source',
			label: 'Read on Drip App/External Source',
		},
		{
			name: 'Read Rate on Drip App/External Source',
			label: 'Read Rate on Drip App/External Source',
		},
	];

	//With Quick Reply and Without ExternalSource
	metrics_list_for_Only_whatsapp_with_quick_reply_without_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
		{ name: 'Quick Reply Selected', label: 'Quick Reply Selected' },
	];

	//Without Quick Reply and Without ExternalSource
	metrics_list_for_Only_whatsapp_without_quick_reply_without_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{ name: 'Delivered', label: 'Delivered' },
		{ name: 'Delivered Rate', label: 'Delivered Rate' },
		{ name: 'Read on Channel', label: 'Read on Channel' },
		{ name: 'Read Rate on Channel', label: 'Read Rate on Channel' },
	];

	///////////////////////////////////// For Only Teams ////////////////////////////
	// With External Link
	metrics_list_for_Only_teams_with_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{
			name: 'Read on Drip App/External Source',
			label: 'Read on Drip App/External Source',
		},
		{
			name: 'Read Rate on Drip App/External Source',
			label: 'Read Rate on Drip App/External Source',
		},
	];
	//WithOut External Link
	metrics_list_for_Only_teams_without_external_source = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
	];

	////////////////////////////////////Only Email///////////////////////////////////
	metrics_list_for_Only_Email_for_send_grid = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
		{
			name: 'Read on Drip App/External Source',
			label: 'Read on Drip App/External Source',
		},
		{
			name: 'Read Rate on Drip App/External Source',
			label: 'Read Rate on Drip App/External Source',
		},
	];

	metrics_list_for_Only_Email_for_broad_side = [
		{ name: 'Scheduled', label: 'Scheduled' },
		{ name: 'Sent', label: 'Sent' },
		{ name: 'Sent Rate', label: 'Sent Rate' },
	];

	operators = [{ name: 'AND' }, { name: 'OR' }];

	activity_score_type_list = [{ name: 'Less than' }, { name: 'Greater than' }, { name: 'Equal' }];
	video_activity_score_type_list = [{ name: 'Less than' }, { name: 'Greater than' }];
	pool_activity_option_list = [];

	flowType = [
		{ name: 'Campaign', value: 'Campaign' },
		{ name: 'Conversational', value: 'Conversational' },
	];

	dayCount = [];
	dripFlowDripData: any = [];
	postIndex = 1;
	selectedAssetForThePost = [];
	allAssetsForPost = [];
	selectedPostType: number;
	clientListNames = [];
	userClientId;
	userId: any;
	clientList = [];
	selectedClient;
	selectedClientName;
	allDripList: any = [];
	editPostIndex = null;
	userRoleId: number;
	editCampaign: any;
	timePicker: any = [];
	selectedDripForDripFlow: any = [];
	selectedDripIndex: number = 1;
	editDripIndex: number = null;
	editDripFlag: boolean = false;
	selected_send_a_drip_list = [];
	selected_take_action_list = [];
	selected_activity_send_a_drip_list = [];
	selected_learner_group = [];
	selected_send_drip_and_take_action_list = [];
	scrollList: HTMLElement;
	showUserActivityBaseOption: boolean = false;
	showUserActivityScoreDDOption: boolean = false;
	showPoolOption: boolean = false;
	learner_group_for_add_to_group = [];
	learner_group_for_delete_to_group = [];
	page = 1;
	limit = 25;
	istriggerDateSelected: boolean = false;
	DripType: any;
	allParamsData: any;
	dripFlow_Data: any;
	selectedClientId: any;
	ownerClient = { name: null, client_id: null, id: null, RoleId: null, UserId: null, fullName: null };
	userListForOwnList = [];
	selectedRoleId: null;
	dripStatus: any;
	pageDetails: any;
	type = 'drip';
	scoreLimit = 0;
	disableField = false;
	startDate = '';
	showImageDripOption = true;
	dripNoderandomString: string;
	actionNoderandomString: string;
	showQuickReplyList = false;
	showQuestionList = false;
	selctedRatingScaleQuestion: boolean = false;
	showTrackingLink: boolean = false;
	pageLoad = false;
	disableAddMetrics = false;
	showContantMilestoneConformationPop = false;
	drip_flow_status: any;
	editSuccessMetricsIndex: any;
	maxScoreForQuiz: any = 0;
	dropDownRatingQuestionList = [];
	onlyWhatsAppQuickReplayList = [];
	pollOptionListForMetrics = [];
	dropDownRatingQuestionsOptionList = [];
	maxRatingForSurvey: any = 0;
	characterRemainsForMetrics: any;
	maxMetricsLength = 35;
	isChannelFlow: boolean = false;

	iconObject = {
		add_icon_35: null,
		info_icon_1_6_rem: null,
	};

	constructor(
		private formBuilder: FormBuilder,
		private toastr: ToastrService,
		private spinnerService: NgxSpinnerService,
		private dripFlowService: ManageDripFlowsService,
		public appService: AppService,
		private assetService: ManageAssetsLibraryService,
		private postService: ManagePostsLibraryService,
		private learnerGroupsService: ManageLearnerGroupsService,
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef
	) {
		///////////////////////////////////////////////////////////////////////////////////////////
		//Remove Team and Whats App Type Drip From the Drip Types Array
		if (!this.appService?.configurable_feature?.teams) {
			[6, 5].forEach((index) => this.dripTypeList.splice(index, 1));
		}
		if (!this.appService?.configurable_feature?.whatsApp) {
			[1, 0].forEach((index) => this.dripTypeList.splice(index, 1));
			[1, 0].forEach((index) => this.dripTypeListWithoutTeam.splice(index, 1));
		}
		///////////////////////////////////////////////////////////////////////////////////////////

		this.dayCount = JSON.parse(
			this.appService.getTranslation('Pages.DripFlow.AddEdit.BuildYourDripFlow.autoUnAssignThisDrip.dropDownList')
		);
	}

	ngOnInit() {
		this.pageDetails = JSON.parse(localStorage.getItem('dripflowPageNo')) || null;
		this.type = this.dripFlowService.type;
		this.createTimerPicker();
		this.createdripFlowDetailsForm();
		this.createdripFlowDripForm();
		this.createSuccessMetricsForm();
		this.getAppBranding();
		this.selectedClientId = JSON.parse(localStorage.getItem('client')).id;
		this.userId = JSON.parse(localStorage.getItem('user')).user.id;
		this.userRoleId = parseInt(localStorage.getItem('roleId'));
		this.allParamsData = this.route.params['_value'];
		this.getCustomDateFields();
		if (this.notOwnAnyAssetRoleId.indexOf(this.userRoleId) > -1) {
			this.dripFlowService.getAllClientAndBranchAccountList(this.selectedClientId).subscribe((res: any) => {
				if (res.success) {
					this.selectedClientId = null;
					this.client_List = [];
					this.client_List = res.data;
					$('#selecteClientList').modal('show');
				}
			});
		} else {
			this.getLearnerGroupByUserId(this.userId, this.selectedClientId, this.userRoleId);
		}

		if (
			this.allParamsData.redictfrom == 'drip' ||
			this.allParamsData.redictfrom == 'learnerGroup' ||
			this.allParamsData.redictfrom == 'contactGroup'
		) {
			this.dripFlow_Data = JSON.parse(localStorage.getItem('temp_dripflow_payload'));
			if (this.dripFlow_Data) {
				if (
					this.dripFlow_Data.campaignDetails &&
					this.dripFlow_Data.campaignDetails.learnerGroup &&
					this.dripFlow_Data.campaignDetails.learnerGroup.length > 0 &&
					this.dripFlow_Data.campaignDetails.learnerGroup.indexOf(0) > -1
				) {
					this.dripFlow_Data.campaignDetails.learnerGroup.splice(
						this.dripFlow_Data.campaignDetails.learnerGroup.indexOf(0),
						1
					);
				}
				this.dripFlow_Data.campaignDetails.learnerGroup;
				this.dripFlowDetailsForm.patchValue(this.dripFlow_Data.campaignDetails);
				this.dripFlowDetailsForm.controls['learnerGroup'].setValue(this.dripFlow_Data.campaignDetails.learnerGroup);
				this.selectedStartOnDate = null;
				this.selectedendOnDate = null;
				setTimeout(() => {
					if (
						this.dripFlow_Data.campaignDetails &&
						this.dripFlow_Data.campaignDetails.startDate &&
						this.dripFlow_Data.campaignDetails.startDate.startDate
					) {
						this.selectedStartOnDate = {
							startDate: moment(this.dripFlow_Data.campaignDetails.startDate.startDate)
								.subtract(0, 'days')
								.startOf('day'),
							endDate: moment(this.dripFlow_Data.campaignDetails.startDate.startDate)
								.subtract(0, 'days')
								.startOf('day'),
						};
					}
					if (
						this.dripFlow_Data.campaignDetails &&
						this.dripFlow_Data.campaignDetails.endDate &&
						this.dripFlow_Data.campaignDetails.endDate.startDate
					) {
						this.selectedendOnDate = {
							startDate: moment(this.dripFlow_Data.campaignDetails.endDate.startDate)
								.subtract(0, 'days')
								.startOf('day'),
							endDate: moment(this.dripFlow_Data.campaignDetails.endDate.startDate).subtract(0, 'days').startOf('day'),
						};
					}
				}, 200);
				this.selectedDripForDripFlow = [];
				for (let drip of this.dripFlow_Data.dripDetails) {
					this.showUserActivityBaseOption = true;
					if (drip.groupForAction && drip.groupForAction == 0) {
						drip.groupForAction = null;
					}
					this.selectedDripForDripFlow.push(drip);
					this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;
				}
				for (let i = 0; i < this.selectedDripForDripFlow.length; i++) {
					if (this.selectedDripForDripFlow[i].dripFlowType == 'Send a Drip') {
						let _drip = this.selectedDripForDripFlow[i];
						_drip.index = i;
						// _drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.dripTitleName;
						_drip.dripDropDownTitle = _drip.dripName;
						this.selected_send_a_drip_list.push(_drip);
						this.selected_send_drip_and_take_action_list.push(_drip);
					} else {
						let _drip = this.selectedDripForDripFlow[i];
						_drip.index = i;
						// _drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.actionType;
						_drip.dripDropDownTitle = _drip.dripName;
						this.selected_take_action_list.push(_drip);
						this.selected_send_drip_and_take_action_list.push(_drip);
					}
				}
				this.createdripFlowDripForm();
			}
		}
		this.editCampaign = this.route.params['_value'];
		if (this.editCampaign && this.editCampaign.campaignId) {
			this.dripFlowService
				.getCampaignById(this.editCampaign.campaignId, this.selectedClientId, this.userId, this.userRoleId)
				.subscribe((res: any) => {
					if (res.success) {
						if (res.data.status == 'Draft') {
							this.canAddMoreDrip = true;
						} else {
							this.canAddMoreDrip = false;
						}

						this.editDripFlag = true;
						this.dripFlowDetailsForm.patchValue(res.data);
						this.selectedStartOnDate = {
							startDate: moment(res.data.startDate).subtract(0, 'days').startOf('day'),
							endDate: moment(res.data.startDate).subtract(0, 'days').startOf('day'),
						};
						this.selectedendOnDate = {
							startDate: moment(res.data.endDate).subtract(0, 'days').startOf('day'),
							endDate: moment(res.data.endDate).subtract(0, 'days').startOf('day'),
						};
						this.successMetricsList =
							this.dripFlowDetailsForm.controls['successMetricsList'].value &&
							this.dripFlowDetailsForm.controls['successMetricsList'].value.length > 0
								? this.dripFlowDetailsForm.controls['successMetricsList'].value
								: [];
						this.dripFlowDetailsForm.controls['startTimeId'].setValue(this.getTimePikerIdByDate(res.data.startDate));
						this.dripFlowDetailsForm.controls['endTimeId'].setValue(this.getTimePikerIdByDate(res.data.endDate));
						let learnerGroupIds = [];
						for (let group of res.data.User_groups) {
							learnerGroupIds.push(group.id);
							this.selected_learner_group.push(group);
						}
						if (res?.data?.CampChannelMappings?.length > 0) {
							learnerGroupIds = [];
							this.isChannelFlow = true;
							for (let channel of res.data.CampChannelMappings) {
								learnerGroupIds.push(channel.TeamChannelId);
								this.campChannelMappingList.push(channel.TeamChannel);
							}
						}
						this.dripFlowDetailsForm.controls['learnerGroup'].setValue(learnerGroupIds);
						// let startRuleLearnerGroup = [];
						// if (res.data && res.data.user_group_for_start_rule && res.data.user_group_for_start_rule.length > 0) {
						// 	for (let startRuleGroup of res.data.user_group_for_start_rule) {
						// 		startRuleLearnerGroup.push(startRuleGroup.UserGroupId);
						// 	}
						// }

						this.dripFlowDetailsForm.controls['learnerGroupForRule'].setValue(learnerGroupIds);

						this.selected_send_drip_and_take_action_list = [];
						this.selected_send_a_drip_list = [];
						this.selected_take_action_list = [];
						this.showUserActivityBaseOption = false;
						this.showUserActivityScoreDDOption = false;
						this.showPoolOption = false;
						this.showImageDripOption = true;
						for (let drip of res.data.Drip_camps) {
							if (drip.dripFlowType == 'Send a Drip') {
								this.showUserActivityBaseOption = true;
								// drip.dripDropDownTitle = drip.dripName + ' - ' + drip.Post.drip_title;
								drip.dripDropDownTitle = drip.dripName;
								this.selected_send_a_drip_list.push(drip);
								this.selected_send_drip_and_take_action_list.push(drip);

								if (this.successMetricsList && this.successMetricsList.length > 0) {
									for (let metric of this.successMetricsList) {
										if (metric.DripCampIndex.length == 1 && metric.DripCampIndex[0] === drip.index) {
											metric.status = drip.status;
										}
									}
								}
								if (drip.dripTriggerRule == 'Send based on system activity') {
									drip.dependencyIndex = null;
									for (let _drip of res.data.Drip_camps) {
										if (_drip.dependencyDripIndex == _drip.index) {
											drip.dependencyIndex = _drip.index;
										}
									}
								}
								if (drip.Post.tempType === 'Quiz' || drip.Post.tempType === 'Quiz (Randomised)') {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = false;
									if (drip.Post.tempType === 'Quiz') {
										this.scoreLimit = drip.Post.DripQuestions.length * 2;
									} else {
										this.scoreLimit = drip.Post.quizRandCount * 2;
									}
								}
								if (drip.Post.tempType === 'Poll') {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = true;
									this.pool_activity_option_list = [];
									for (let option of drip.Post.DripQuestions[0].DripOptions) {
										this.pool_activity_option_list.push({ name: option.text });
									}
								}
								if (drip.Post.tempType === 'Single Image') {
									this.showImageDripOption = false;
								}
							} else {
								drip.dripDropDownTitle = drip.dripName + ' - ' + drip.actionType;
								this.selected_take_action_list.push(drip);
								this.selected_send_drip_and_take_action_list.push(drip);

								if (drip && drip.User_groups.length > 0) {
									drip.groupForAction = [];
									for (let group of drip.User_groups) {
										drip.groupForAction.push(group.id);
									}
								}
							}

							let temp = drip;
							temp.dripId = temp.PostId;
							temp.dripTriggerTimeId = this.getTimePikerIdByDate(temp.dripTriggerDate);
							temp.dripTriggerActualTime = this.getActculTimeByDate(temp.dripTriggerDate);
							temp.dripPublished = temp.dripPublished;
							if (drip && drip.Post) {
								temp.dripTitleName = drip.Post.drip_title;
							}

							if (drip && drip.dripType && drip.dripType.includes('WhatsApp') > -1) {
								temp.whatsAppTemplateFlag = true;
							} else {
								temp.whatsAppTemplateFlag = false;
							}

							if (drip && drip.Post && drip.Post.Drip_whatsapp_natives.length > 0) {
								if (drip && drip.Post && drip.Post.Drip_whatsapp_natives[0].templateStatus != 'Enabled') {
									temp.templateStatus = drip.Post.Drip_whatsapp_natives[0].templateStatus;
								} else {
									temp.templateStatus = null;
								}
							} else if (drip && drip.Post && drip.Post.Drip_whatsapp_non_natives.length > 0) {
								if (drip && drip.Post && drip.Post.Drip_whatsapp_non_natives[0].templateStatus != 'Enabled') {
									temp.templateStatus = drip.Post.Drip_whatsapp_non_natives[0].templateStatus;
								} else {
									temp.templateStatus = null;
								}
							}

							if (drip && drip.Post) {
								temp.tempType = drip.Post.tempType;
							}

							if (drip.status != 'Scheduled') {
								this.disableAddMetrics = true;
							}
							this.selectedDripForDripFlow.push(temp);
						}
						this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;

						if (this.editCampaign && this.editCampaign.campaignId && this.editCampaign.type == 'copy') {
							this.editDripFlag = false;
							this.canAddMoreDrip = true;
							this.dripFlowDetailsForm.controls['title'].setValue('Copy of - ' + res.data.title);
							this.dripFlowDetailsForm.controls['id'].setValue(null);
							this.dripFlowDetailsForm.controls['startTimeId'].setValue(null);
							this.dripFlowDetailsForm.controls['endTimeId'].setValue(null);
							this.dripFlowDetailsForm.controls['learnerGroup'].setValue(null);

							for (let metric of this.successMetricsList) {
								metric.status = 'Scheduled';
							}
							for (let data of this.selectedDripForDripFlow) {
								data.id = null;
								data.dripTriggerActualTime = null;
								data.dripTriggerDate = null;
								data.dripTriggerTimeId = null;
								data.status = 'Scheduled';
							}
							this.selectedStartOnDate = null;
							this.selectedendOnDate = null;
							this.selecteddripTriggerDate = null;
							this.selecteddripActionDate = null;
						}

						if (this.editCampaign && this.editCampaign.campaignId && this.editCampaign.type == 'view') {
							this.dripFlowDetailsForm.disable();
							this.dripFlowDripForm.disable();
						}
						if (
							this.editCampaign &&
							this.editCampaign.campaignId &&
							this.editCampaign.type == 'edit' &&
							res.data.status !== 'Draft'
						) {
							this.disableField = true;
							this.startDate = moment(this.dripFlowDetailsForm.value.startDate).format('DD-MM-YYYY');
						}
					}
				});
		} else {
			this.selectedStartOnDate = {
				startDate: moment().subtract(0, 'days').startOf('day'),
				endDate: moment().subtract(0, 'days').startOf('day'),
			};
			this.selectedendOnDate = {
				startDate: moment().add(1, 'days').startOf('day'),
				endDate: moment().add(1, 'days').startOf('day'),
			};
		}
		// this.getAllClientList(this.selectedClientId);
	}

	getAppBranding() {
		this.appService.setIconWhiteBranding(this.iconObject);
	}

	getCustomDateFields() {
		this.pageLoad = false;
		this.dripFlowService.getCustomFieldsByClientId(this.selectedClientId).subscribe((res: any) => {
			if (res.success) {
				if (res.data && res.data.length > 0) {
					for (let field of res.data) {
						if (field.dataType == 'Date picker') {
							this.customDateFieldsList.push({ label: field.label, dataType: field.dataType });
						}
					}
					if (this.customDateFieldsList.length > 0) {
						this.drip_trigger_ruleList.push({
							name: 'Send based on contact milestone',
							label: 'Send based on contact milestone',
						});
						this.drip_trigger_rule_List_without_user_base_activity.push({
							name: 'Send based on contact milestone',
							label: 'Send based on contact milestone',
						});
						this.drip_trigger_ruleList2.push({
							name: 'Send based on contact milestone',
							label: 'Send based on contact milestone',
						});
						this.drip_trigger_rule_List_without_user_base_activity2.push({
							name: 'Send based on contact milestone',
							label: 'Send based on contact milestone',
						});
					}
				} else {
					this.customDateFieldsList = [];
				}

				if (res?.haveTeamAccessToken?.id) {
					this.haveTeamSetup = true;
				}
			}
			this.pageLoad = true;
		});
	}

	ngAfterViewChecked() {
		this.cdr.detectChanges();
	}

	createTimerPicker() {
		let timerId = 0;
		for (let HH = 0; HH <= 23; HH++) {
			for (let MM = 0; MM <= 45; MM = MM + 15) {
				let hours = HH.toString().length == 1 ? '0' + HH.toString() : HH.toString();
				let minutes = MM.toString().length == 1 ? '0' + MM.toString() : MM.toString();

				this.timePicker.push({
					id: timerId,
					time: `${hours}:${minutes}`,
					hours: hours,
					minutes: minutes,
				});
				timerId++;
			}
		}
	}

	getTimePikerIdByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.id;
			}
		}
	}

	getActculTimeByDate(date: Date) {
		date = new Date(date);
		let minutes =
			date.getMinutes().toString().length == 1 ? 0 + date.getMinutes().toString() : date.getMinutes().toString();
		let hours = date.getHours().toString().length == 1 ? 0 + date.getHours().toString() : date.getHours().toString();
		for (let time of this.timePicker) {
			if (time.hours == hours && time.minutes == minutes) {
				return time.time;
			}
		}
	}

	getDateByDateAndTimePickerId(date, id) {
		let timePickerData;
		for (let time of this.timePicker) {
			if (time.id == id) {
				timePickerData = time;
			}
		}
		return new Date(date).setHours(parseInt(timePickerData.hours), parseInt(timePickerData.minutes), 0, 0);
	}

	// /////////////////////////////////////////////////////////////////////////////////Campaign Part//////////////////////////////////////////////////////

	getLearnerGroupByUserId(userId, clientId, roleId) {
		this.dripFlowService.getOnlyLearnerGroupByUserId(userId, clientId, roleId).subscribe((res: any) => {
			if (res.success) {
				this.learnerGroupList = [];
				this.learner_group_for_add_to_group = [];
				this.learner_group_for_delete_to_group = [];

				if (res.data && res.data.length > 0 && res.data[res.data.length - 1]?.isChannel == true) {
				} else {
					this.learnerGroupList.push({
						id: -1,
						title: 'Select All',
					});
				}

				this.learnerGroupList.push({
					id: 0,
					title: 'Create New Group',
				});

				for (let learnerGroup of res.data) {
					if (learnerGroup.is_deleted == false) {
						this.learnerGroupList.push(learnerGroup);
						if (learnerGroup.defaultGroupForDiwo == false && learnerGroup.defaultGroupForDrip == false) {
							this.learner_group_for_delete_to_group.push(learnerGroup);
							let flag = true;
							for (let selctedGroup of this.selected_learner_group) {
								if (selctedGroup.id == learnerGroup.id) {
									flag = false;
								}
							}
							if (flag) {
								this.learner_group_for_add_to_group.push(learnerGroup);
							}
						}
					}
				}
				if (this.learnerGroupList && this.learnerGroupList.length > 0) {
				}
			}
		});
	}

	createdripFlowDetailsForm() {
		this.dripFlowDetailsForm = this.formBuilder.group({
			id: null,
			title: [null, Validators.required],
			description: [''],
			startDate: [null],
			startTimeId: [null],
			endDate: [null, Validators.required],
			endTimeId: [null, Validators.required],
			learnerGroup: [null, Validators.required],
			startRule: [null, Validators.required],
			startAfter: [0],
			learnerGroupForRule: [[], null],
			tags: [null],
			operator: [null],
			successMetrics: [false],
			successMetricsList: [null],
			flowType: ['Campaign', Validators.required],
		});
	}
	get f() {
		return this.dripFlowDetailsForm.controls;
	}

	createdripFlowDripForm() {
		this.dripFlowDripForm = this.formBuilder.group({
			// For Send A Drip
			id: [null],
			dripName: [null, Validators.required],
			dripType: [null],
			dripId: [null],
			dripTriggerRule: [null],
			dripTriggerDate: [null],
			dripTriggerTimeId: [null],
			tempType: [null],
			// Take Action
			actionType: [null],
			actionTriggerRule: [null],

			// Comman
			dependencyDripIndex: [null],
			sendAfter: [0],
			userAction: [null],
			activityScoreType: [null],
			score: [0],
			dripFlowType: ['Send a Drip', Validators.required],

			dripTriggerActualTime: [null],
			dripTitleName: [null],
			dripPublished: [false],
			status: ['Scheduled'],
			templateStatus: [null],
			whatsAppTemplateFlag: [false],
			assetVideoTranscoding: [true],
			dependencyIndex: [null],
			showDependancyDD: [false],
			index: [this.selectedDripForDripFlow.length],
			systemActionType: [null],
			tagsForSystemAction: [null],
			groupForAction: [null],
			tagsForAction: [null],
			selected_send_drip_and_take_action_list: [],
			selected_send_a_drip_list: [],
			selected_activity_send_a_drip_list: [],
			unAssignDayCount: [],

			// new fields
			dripActionEndDate: [null],
			dripActionEndTimeId: [null],
			poolOptionType: [null],
			within: [0],

			quickReplyList: [null],
			quickReply: [null],
			DripQuestionId: [null],
			showTrackableLink: [false],
			milestoneField: [null],
			recurAnnually: [false],
		});
	}
	get f2() {
		return this.dripFlowDripForm.controls;
	}

	createSuccessMetricsForm() {
		this.successMetricsForm = this.formBuilder.group({
			id: null,
			label: [null, Validators.required],
			DripCampIndex: [[], Validators.required],
			PostId: [null],
			metrics: [null, Validators.required],
			tempType: [null],
			dripType: [null],
			activityScoreType: [null],
			score: [0],
			DripOptionId: [null],
			option: [null],
			DripQuestionId: [null],
			question: [null],
			quickReply: [null],
			offlineTaskText: [null],
			status: [null],
		});
	}
	get f3() {
		return this.successMetricsForm.controls;
	}

	markAsTouched(group: FormGroup | FormArray) {
		Object.keys(group.controls).map((field) => {
			const control = group.get(field);
			if (control instanceof FormControl) {
				control.markAsTouched({ onlySelf: true });
			} else if (control instanceof FormGroup) {
				this.markAsTouched(control);
			}
		});
	}

	randomString(length, chars) {
		var result = '';
		for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
		return result;
	}

	onChangeNodeType() {
		if (
			this.dripFlowDripForm.value.dripId !== '' &&
			this.dripFlowDripForm.value.dripId !== null &&
			this.dripFlowDripForm.value.dripId !== undefined
		) {
			if (this.dripFlowDripForm.value.dripFlowType == 'Send a Drip') {
				this.dripFlowDripForm.controls['dripName'].setValue(this.dripNoderandomString);
			}
		}
		if (
			this.dripFlowDripForm.value.actionType !== '' &&
			this.dripFlowDripForm.value.actionType !== null &&
			this.dripFlowDripForm.value.actionType !== undefined
		) {
			if (this.dripFlowDripForm.value.dripFlowType == 'Take Action') {
				this.dripFlowDripForm.controls['dripName'].setValue(this.actionNoderandomString);
			}
		}
	}

	onPostPicked(event) {
		if (event.drip_title === 'Create New Drip') {
			$('#createdripModal').modal('show');
		} else {
			const rNumber = this.randomString(6, '0123456789');
			// let randomString = '';
			this.dripNoderandomString = `Drip Node ${rNumber}_${event.drip_title}`;
			this.dripFlowDripForm.controls['dripName'].setValue(this.dripNoderandomString);
			this.dripFlowDripForm.controls['dripTitleName'].setValue(event.drip_title);

			this.dripFlowDripForm.controls['quickReplyList'].setValue(null);

			if (this.dripFlowDripForm.controls['whatsAppTemplateFlag'].value == true) {
				// Drip_whatsapp_natives
				// Drip_whatsapp_non_natives
				if (event.Drip_whatsapp_natives.length > 0) {
					if (event.Drip_whatsapp_natives[0].templateStatus != 'Enabled') {
						this.dripFlowDripForm.controls['templateStatus'].setValue(event.Drip_whatsapp_natives[0].templateStatus);
					} else {
						this.dripFlowDripForm.controls['templateStatus'].setValue(null);
					}

					if (
						event.Drip_whatsapp_natives[0].trackableLink ||
						event.Drip_whatsapp_natives[0].trackableLink2 ||
						event.Drip_whatsapp_natives[0].zoomTrackable ||
						event.Drip_whatsapp_natives[0].zoomTrackable2
					) {
						this.dripFlowDripForm.controls['showTrackableLink'].setValue(true);
					}

					let quickReplay = [];
					for (let i = 1; i <= 10; i++) {
						if (event.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
							quickReplay.push({ label: event.Drip_whatsapp_natives[0]['quickReply' + i], PostId: event.id });
						}
					}
					if (quickReplay.length > 0) {
						this.dripFlowDripForm.controls['quickReplyList'].setValue(quickReplay);
					}
				} else if (event.Drip_whatsapp_non_natives.length > 0) {
					if (event.Drip_whatsapp_non_natives[0].templateStatus != 'Enabled') {
						this.dripFlowDripForm.controls['templateStatus'].setValue(
							event.Drip_whatsapp_non_natives[0].templateStatus
						);
					} else {
						this.dripFlowDripForm.controls['templateStatus'].setValue(null);
					}
				}
			} else if (event.DripOnlyTeams.length > 0) {
				if (
					event.DripOnlyTeams[0].trackableLink1 ||
					event.DripOnlyTeams[0].trackableLink2 ||
					event.DripOnlyTeams[0].trackableLink3
				) {
					this.dripFlowDripForm.controls['showTrackableLink'].setValue(true);
				}
			}
		}
		if (
			event &&
			event.Assets &&
			event.Assets[0] &&
			event.Assets[0].Asset_details &&
			event.Assets[0].Asset_details[0].displayType == 'Video' &&
			event.Assets[0].Asset_details[0].isTranscoding == false
		) {
			this.dripFlowDripForm.controls['assetVideoTranscoding'].setValue(false);
		} else {
			this.dripFlowDripForm.controls['assetVideoTranscoding'].setValue(true);
		}
		if (event.tempType) {
			this.dripFlowDripForm.controls['tempType'].setValue(event.tempType);
		}

		// console.log('-----Form', this.dripFlowDripForm.value);
	}

	openConfirmation() {
		$('#confirmationModal').modal('show');
	}

	backup() {
		let payload = {
			campaignDetails: this.dripFlowDetailsForm.value,
			dripDetails: this.selectedDripForDripFlow,
		};
		localStorage.setItem('temp_dripflow_payload', JSON.stringify(payload));
	}

	onProceed() {
		this.backup();
		this.router.navigate(['/learner-groups/add-or-edit-learner-group', { redictfrom: 'drip-flow' }]);
		$('#confirmationModal').modal('hide');
	}

	onCancel() {
		$('#confirmationModal').modal('hide');
	}

	onProceedDrip() {
		this.backup();
		this.router.navigate(['/drips-library/add-or-edit-drip', { type: this.DripType, redictfrom: 'drip-flow' }]);
		$('#createdripModal').modal('hide');
	}

	onCancelDrip() {
		$('#createdripModal').modal('hide');
		this.dripFlowDripForm.controls['dripId'].setValue(null);
	}

	checkValidition(formName) {
		if (
			(this.dripFlowDripForm.controls[formName].value == '' ||
				this.dripFlowDripForm.controls[formName].value == null) &&
			this.dripFlowDripForm.controls[formName].value != 0
		) {
			this.dripFlowDripForm.controls[formName].setErrors({ required: true });
			this.dripFlowDripForm.controls[formName].markAsTouched({ onlySelf: true });
			return true;
		} else {
			return false;
		}
	}

	addMoreDrip() {
		if (this.dripFlowDetailsForm.value.startRule == 'Start on date') {
			if (this.dripFlowDetailsForm.value.startTimeId == null) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectStartTime'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
			if (this.dripFlowDetailsForm.value.endTimeId == null) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectEndTime'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		if (
			this.dripFlowDetailsForm.value.startRule == 'Start when learner is added to group' ||
			this.dripFlowDetailsForm.value.startRule == 'Start when tag is added to learner'
		) {
			if (this.dripFlowDetailsForm.value.endTimeId == null) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectEndTime'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		// if (this.dripFlowDetailsForm.value.startRule == "Start when tag is added to learner") {
		//     if (this.dripFlowDetailsForm.value.endTimeId == null) {
		//         this.toastr.error(this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectEndTime'), this.appService.getTranslation('Utils.error'));
		//         return;
		//     }
		// }

		this.selecteddripTriggerDate = {
			startDate: moment().subtract(0, 'days').startOf('day'),
			endDate: moment().subtract(0, 'days').startOf('day'),
		};
		// if (this.dripFlowDripForm.invalid) {
		//     this.markAsTouched(this.dripFlowDripForm);
		//     return;
		// }

		if (this.selecteddripTriggerDate == null) {
			this.istriggerDateSelected = true;
			return;
		}

		// Need to Add Validation For Send a drip and Take Action
		let flag = false;

		if (this.checkValidition('dripName')) {
			flag = true;
		}
		//For Send a Drip and Take Action manual Validation

		if (this.dripFlowDripForm.value.dripFlowType == 'Send a Drip') {
			if (this.checkValidition('dripType')) {
				flag = true;
			}
			if (this.checkValidition('dripId')) {
				flag = true;
			}
			if (this.checkValidition('dripTriggerRule')) {
				flag = true;
			}

			if (this.dripFlowDripForm.value.dripTriggerRule == 'Send on date') {
				if (this.checkValidition('dripTriggerDate')) {
					flag = true;
				}
				if (this.checkValidition('dripTriggerTimeId')) {
					flag = true;
				}
			} else if (this.dripFlowDripForm.value.dripTriggerRule == 'Send based on system activity') {
				if (this.checkValidition('systemActionType')) {
					flag = true;
				}
				if (this.dripFlowDripForm.value.systemActionType == 'Based on drip sent') {
					if (this.checkValidition('dependencyDripIndex')) {
						flag = true;
					}
				} else if (this.dripFlowDripForm.value.systemActionType == 'Based on previous action taken') {
					if (this.checkValidition('dependencyDripIndex')) {
						flag = true;
					}
				} else if (this.dripFlowDripForm.value.systemActionType == 'Based on tags added') {
					if (this.checkValidition('tagsForSystemAction')) {
						flag = true;
					}
				}
			} else if (this.dripFlowDripForm.value.dripTriggerRule == 'Send based on user activity') {
				if (this.checkValidition('userAction')) {
					flag = true;
				}
				if (this.checkValidition('dependencyDripIndex')) {
					flag = true;
				}

				if (this.dripFlowDripForm.value.userAction == 'Activity Outcome') {
					if (!this.showPoolOption && !this.showQuickReplyList && !this.showQuestionList) {
						if (this.checkValidition('activityScoreType')) {
							flag = true;
						}
						if (this.checkValidition('score')) {
							flag = true;
						}
					} else if (this.showQuickReplyList) {
						if (this.checkValidition('quickReply')) {
							flag = true;
						}
					} else if (this.showQuestionList) {
						// console.log('---1----');
						if (this.checkValidition('DripQuestionId')) {
							// console.log('---2----');

							flag = true;
						}

						//For Rating Scale
						if (this.selctedRatingScaleQuestion) {
							if (this.checkValidition('activityScoreType')) {
								flag = true;
							}
							if (this.checkValidition('score')) {
								flag = true;
							}
						} else {
							//For MCQ
							if (this.checkValidition('poolOptionType')) {
								flag = true;
							}
						}
					} else {
						if (this.checkValidition('poolOptionType')) {
							flag = true;
						}
					}
				}
			} else if (this.dripFlowDripForm.value.dripTriggerRule == 'Send based on contact milestone') {
				if (this.checkValidition('milestoneField')) {
					flag = true;
				}
				if (this.checkValidition('dripTriggerTimeId')) {
					flag = true;
				}
			}
		} else if (this.dripFlowDripForm.value.dripFlowType == 'Take Action') {
			if (this.checkValidition('actionType')) {
				flag = true;
			}

			if (this.dripFlowDripForm.value.actionType == 'Unlicense learner') {
			} else if (this.dripFlowDripForm.value.actionType == 'Add to group') {
				if (this.checkValidition('groupForAction')) {
					flag = true;
				}
			} else if (this.dripFlowDripForm.value.actionType == 'Delete from group') {
				if (this.checkValidition('groupForAction')) {
					flag = true;
				}
			} else if (this.dripFlowDripForm.value.actionType == 'Add Tag') {
				if (this.checkValidition('tagsForAction')) {
					flag = true;
				}
			} else if (this.dripFlowDripForm.value.actionType == 'Delete Tag') {
				if (this.checkValidition('tagsForAction')) {
					flag = true;
				}
			}
			if (this.checkValidition('actionTriggerRule')) {
				flag = true;
			}

			if (this.dripFlowDripForm.value.actionTriggerRule == 'Take action on date') {
				if (this.checkValidition('dripTriggerDate')) {
					flag = true;
				}
				if (this.checkValidition('dripTriggerTimeId')) {
					flag = true;
				}
			} else if (this.dripFlowDripForm.value.actionTriggerRule == 'Take action based on system activity') {
				if (this.checkValidition('systemActionType')) {
					flag = true;
				}

				if (this.dripFlowDripForm.value.systemActionType == 'Based on drip sent') {
					if (this.checkValidition('dependencyDripIndex')) {
						flag = true;
					}
				} else if (this.dripFlowDripForm.value.systemActionType == 'Based on previous action taken') {
					if (this.checkValidition('dependencyDripIndex')) {
						flag = true;
					}
				} else if (this.dripFlowDripForm.value.systemActionType == 'Based on tags added') {
					if (this.checkValidition('tagsForSystemAction')) {
						flag = true;
					}
				}
			} else if (this.dripFlowDripForm.value.actionTriggerRule == 'Take action based on user activity') {
				if (this.checkValidition('dependencyDripIndex')) {
					flag = true;
				}
				if (this.checkValidition('userAction')) {
					flag = true;
				}
				if (this.dripFlowDripForm.value.userAction == 'Activity Outcome') {
					// if (!this.showPoolOption) {
					// 	if (this.checkValidition('activityScoreType')) {
					// 		flag = true;
					// 	}
					// 	if (this.checkValidition('score')) {
					// 		flag = true;
					// 	}
					// } else {
					// 	if (this.checkValidition('poolOptionType')) {
					// 		flag = true;
					// 	}
					// }

					if (!this.showPoolOption && !this.showQuickReplyList && this.showQuestionList) {
						if (this.checkValidition('activityScoreType')) {
							flag = true;
						}
						if (this.checkValidition('score')) {
							flag = true;
						}
					} else if (this.showQuickReplyList) {
						if (this.checkValidition('quickReply')) {
							flag = true;
						}
					} else if (this.showQuestionList) {
						if (this.checkValidition('DripQuestionId')) {
							flag = true;
						}

						//For Rating Scale
						if (this.selctedRatingScaleQuestion) {
							if (this.checkValidition('activityScoreType')) {
								flag = true;
							}
							if (this.checkValidition('score')) {
								flag = true;
							}
						} else {
							//For MCQ
							if (this.checkValidition('poolOptionType')) {
								flag = true;
							}
						}
					} else {
						if (this.checkValidition('poolOptionType')) {
							flag = true;
						}
					}
				}
			}
			this.dripFlowDripForm.controls['dripId'].setValue(null);
			this.dripFlowDripForm.controls['dripType'].setValue(null);
		} else {
			flag = true;
		}

		if (flag) {
			return;
		}
		if (
			['Not read on channel', 'Not read on drip app', 'Drip Action not taken', 'Drip submit Action not taken'].includes(
				this.dripFlowDripForm.value.userAction
			)
		) {
			if (!this.dripFlowDripForm.value.within) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectWithin'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		}

		if (this.dripFlowDripForm.value.score) {
			if (this.scoreLimit < this.dripFlowDripForm.value.score) {
				let message =
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.scoreError') + ' ' + this.scoreLimit;
				this.toastr.error(message, this.appService.getTranslation('Utils.error'));
				return;
			}
		}
		// ---------For Edit----------------
		if (this.editDripIndex != null) {
			let payload = this.dripFlowDripForm.value;

			if (
				(this.dripFlowDripForm.value.dripTriggerDate &&
					this.dripFlowDripForm.value.dripTriggerDate.startDate != undefined) ||
				(this.dripFlowDripForm.value.dripTriggerDate && this.dripFlowDripForm.value.dripTriggerDate.startDate != null)
			) {
				payload.dripTriggerDate = this.dripFlowDripForm.value.dripTriggerDate.startDate.format('YYYY-MM-DD');
			}

			// if (
			// 	(this.dripFlowDripForm.value.dripActionEndDate &&
			// 		this.dripFlowDripForm.value.dripActionEndDate.startDate != undefined) ||
			// 	(this.dripFlowDripForm.value.dripActionEndDate &&
			// 		this.dripFlowDripForm.value.dripActionEndDate.startDate != null)
			// ) {
			// 	payload.dripActionEndDate = this.dripFlowDripForm.value.dripActionEndDate.startDate.format('YYYY-MM-DD');
			// }

			this.dripFlowDripForm.reset();
			this.selectedDripForDripFlow[this.editDripIndex] = payload;
			this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;
			this.editDripIndex = null;
			this.createdripFlowDripForm();
		} else {
			// ------For Add new Drip for Drip Flow----------
			let payload = this.dripFlowDripForm.value;

			if (
				(this.dripFlowDripForm.value.dripTriggerDate &&
					this.dripFlowDripForm.value.dripTriggerDate.startDate != undefined) ||
				(this.dripFlowDripForm.value.dripTriggerDate && this.dripFlowDripForm.value.dripTriggerDate.startDate != null)
			) {
				payload.dripTriggerDate = this.dripFlowDripForm.value.dripTriggerDate.startDate.format('YYYY-MM-DD');
			}

			// if (
			// 	(this.dripFlowDripForm.value.dripActionEndDate &&
			// 		this.dripFlowDripForm.value.dripActionEndDate.startDate != undefined) ||
			// 	(this.dripFlowDripForm.value.dripActionEndDate &&
			// 		this.dripFlowDripForm.value.dripActionEndDate.startDate != null)
			// ) {
			// 	payload.dripActionEndDate = moment(this.dripFlowDripForm.value.dripActionEndDate).format('YYYY-MM-DD');
			// }
			this.dripFlowDripForm.reset();
			this.selectedDripForDripFlow.push(payload);
			this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;
			this.createdripFlowDripForm();
		}
		this.allDripList = [];
		this.dependancyDrip = null;
		this.selected_send_a_drip_list = [];
		this.selected_send_drip_and_take_action_list = [];
		this.selected_activity_send_a_drip_list = [];
		this.selected_take_action_list = [];
		this.showUserActivityScoreDDOption = false;
		this.showPoolOption = false;
		this.showImageDripOption = true;
		for (let i = 0; i < this.selectedDripForDripFlow.length; i++) {
			if (this.selectedDripForDripFlow[i].dripFlowType == 'Send a Drip') {
				let _drip = this.selectedDripForDripFlow[i];
				_drip.index = i;
				// _drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.dripTitleName;
				_drip.dripDropDownTitle = _drip.dripName;
				this.selected_send_a_drip_list.push(_drip);
				this.selected_send_drip_and_take_action_list.push(_drip);
				for (let tempDrip of this.allDripList) {
					if (
						_drip.dripId == tempDrip.id &&
						(tempDrip.tempType === 'Quiz' || tempDrip.tempType === 'Quiz (Randomised)')
					) {
						this.showUserActivityScoreDDOption = true;
						this.showPoolOption = false;
						this.selected_activity_send_a_drip_list.push(_drip);
						if (tempDrip.tempType === 'Quiz') {
							this.scoreLimit = tempDrip.DripQuestions.length * 2;
						} else {
							this.scoreLimit = tempDrip.quizRandCount * 2;
						}
					} else if (_drip.dripId == tempDrip.id && tempDrip.tempType == 'Poll') {
						this.showUserActivityScoreDDOption = true;
						this.showPoolOption = true;
						// on saving drip rool
						//this.pool_activity_option_list = [];
						// for (let option of drip.Post.DripQuestions[0].DripOptions) {
						// 	this.pool_activity_option_list.push({ name: option.text });
						// }
					} else if (_drip.dripId == tempDrip.id && tempDrip.tempType === 'Single Image') {
						this.showImageDripOption = false;
					}
				}
			} else {
				let _drip = this.selectedDripForDripFlow[i];
				_drip.index = i;
				_drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.actionType;
				this.selected_take_action_list.push(_drip);
				this.selected_send_drip_and_take_action_list.push(_drip);
			}
		}
		this.showUserActivityBaseOption = false;
		for (let temp of this.selectedDripForDripFlow) {
			if (temp.dripFlowType == 'Send a Drip') {
				this.showUserActivityBaseOption = true;
			}
		}
	}

	getAllClientList(userClientId) {
		this.spinnerService.show();
		this.appService.getAllClientList(userClientId).subscribe((res: any) => {
			if (res.success) {
				for (let client of res.data) {
					this.clientListNames.push(client.name);
				}
				this.addClientList(res.data);
			}
			this.spinnerService.hide();
		});
	}

	addClientList(clientList) {
		this.clientList = [];
		let userClient = JSON.parse(localStorage.getItem('client'));
		this.clientList.push(userClient);
		for (let client of clientList) {
			this.clientList.push(client);
		}
		this.selectedClient = this.clientList[0];
		if (this.clientList && this.clientList.length > 0) {
			this.selectedClientName = this.clientList[0].name;
		}
		this.getAllPostByClient(this.selectedClient.id);
	}

	getAllPostByClient(clientId) {
		this.postService.getAllPostsByClientForPost(clientId).subscribe((res: any) => {
			if (res.success) {
				let temp = [];
				temp.push({ id: 0, drip_title: 'Create New Drip' });
				res.data.filter((drip) => {
					if (drip.is_deleted == false) {
						temp.push(drip);
					}
				});
				this.allDripList = temp;
			}
		});
	}

	getPostListByPostType(event) {
		if (event) {
			this.DripType = event.name;
		}
		this.dripFlowDripForm.controls['dripId'].setValue(null);
		if (event) {
			this.postService
				.getAllPostsByClientAndPostType(this.selectedClientId, event.name, this.isChannelFlow)
				.subscribe((res: any) => {
					if (res.success) {
						let temp = [];
						temp.push({ id: 0, drip_title: 'Create New Drip' });
						res.data.filter((drip) => {
							if (drip.is_deleted == false) {
								temp.push(drip);
							}
						});
						this.allDripList = temp;
						if (event && event.name && event.name.includes('WhatsApp')) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(true);
						} else if (event && event.name) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(false);
							this.dripFlowDripForm.controls['templateStatus'].setValue(null);
						}
					}
				});
		}
	}

	selectPost(type) {
		this.selectedPostType = type.type;
	}

	addOrEditGroup() {
		if (this.dripFlowDripForm.invalid) {
			this.markAsTouched(this.dripFlowDripForm);
			return;
		}

		if (this.editPostIndex !== null) {
			this.dripFlowDripData[this.editPostIndex] = this.dripFlowDripForm.value;
			this.dripFlowDripForm.reset();
			this.createdripFlowDripForm();

			this.allDripList = [];
			this.editPostIndex = null;
		} else {
			this.dripFlowDripData.push(this.dripFlowDripForm.value);
			this.dripFlowDripForm.reset();
			this.createdripFlowDripForm();

			this.allDripList = [];
		}
	}

	deletepost(item, i) {
		this.dripFlowDripData.splice(i, 1);
	}

	selectActionType(event) {
		const rNumber = this.randomString(6, '0123456789');
		// let randomString = '';
		this.actionNoderandomString = `Action Node ${rNumber}_${event.name}`;
		this.dripFlowDripForm.controls['dripName'].setValue(this.actionNoderandomString);

		this.dripFlowDripForm.controls['groupForAction'].setValue(null);
		this.dripFlowDripForm.controls['tagsForAction'].setValue(null);
		if (this.dripFlowDripForm.controls['actionType'].value == 'Add to group') {
			this.learner_group_for_add_to_group = [];
			for (let group of this.learnerGroupList) {
				if (!group.defaultGroupForDrip && !group.defaultGroupForDiwo) {
					let flag = true;
					for (let selectedGroup of this.selected_learner_group) {
						if (selectedGroup.id == group.id) {
							flag = false;
						}
					}
					if (flag) {
						this.learner_group_for_add_to_group.push(group);
					}
				}
			}
		}
	}

	selectLearnerGroup(event) {
		let flag_1 = false;
		if (event.length == 1) {
			//For Create Campaign
			if (!this.editDripFlag) {
				if (event[0].isChannel) {
					this.isChannelFlow = true;
					this.dripFlowDetailsForm.controls['flowType'].setValue('Campaign');
					this.dripFlowDetailsForm.controls['flowType'].disable();
				} else if (!this.editDripFlag) {
					this.isChannelFlow = false;
					this.dripFlowDetailsForm.controls['flowType'].enable();
				}
			} else {
				//For Update Campaign
				if (event[0].isChannel && !this.isChannelFlow) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.notChannelWithGroup'),
						this.appService.getTranslation('Utils.error')
					);
					flag_1 = true;
				} else if (!event[0].isChannel && this.isChannelFlow) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.notGroupWithChannel'),
						this.appService.getTranslation('Utils.error')
					);
					flag_1 = true;
				}
			}
		} else if (event.length == 0) {
			if (!this.editDripFlag) {
				this.isChannelFlow = false;
				this.dripFlowDetailsForm.controls['flowType'].enable();
			}
		}

		if (event.length > 1) {
			if (!this.isChannelFlow) {
				if (event[event.length - 1]?.isChannel) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.notChannelWithGroup'),
						this.appService.getTranslation('Utils.error')
					);

					flag_1 = true;
				}
			} else {
				if (event[event.length - 1].id == 0) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.notCreateGroupWithChannel'),
						this.appService.getTranslation('Utils.error')
					);
					flag_1 = true;
				} else if (!event[event.length - 1].isChannel) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.notGroupWithChannel'),
						this.appService.getTranslation('Utils.error')
					);
					flag_1 = true;
				}
			}
		}

		if (this.isChannelFlow) {
			this.campChannelMappingList = event;
		} else {
			this.campChannelMappingList = [];
		}

		if (flag_1) {
			let selectedValue = this.dripFlowDetailsForm.controls['learnerGroup'].value;
			selectedValue.pop();
			this.dripFlowDetailsForm.controls['learnerGroup'].setValue(selectedValue);
			return;
		}

		let flag = false;
		let selectAll = false;
		for (let data of event) {
			if (data.id == 0) {
				flag = true;
			} else if (data.id == -1) {
				selectAll = true;
			}
		}
		if (selectAll) {
			let learnerGroupIds = this.dripFlowDetailsForm.controls['learnerGroup'].value;
			if (learnerGroupIds.indexOf(0) > -1) {
				learnerGroupIds.splice(learnerGroupIds.indexOf(0), 1);
			}
			if (learnerGroupIds.indexOf(-1) > -1) {
				learnerGroupIds.splice(learnerGroupIds.indexOf(-1), 1);
			}

			this.dripFlowDetailsForm.controls['learnerGroup'].setValue(learnerGroupIds);

			if (this.dripFlowDetailsForm.controls['learnerGroup'].value.length > 0) {
				this.dripFlowDetailsForm.controls['learnerGroup'].setValue(null);
			} else {
				this.dripFlowDetailsForm.controls['learnerGroup'].setValue(null);
				let group = [];
				for (let learnerGroup of this.learnerGroupList) {
					if (learnerGroup.id != 0 && learnerGroup.id != -1) {
						group.push(learnerGroup.id);
					}
				}
				this.dripFlowDetailsForm.controls['learnerGroup'].setValue(group);
			}
		} else if (flag) {
			let learnerGroupIds = this.dripFlowDetailsForm.controls['learnerGroup'].value;
			learnerGroupIds.splice(learnerGroupIds.indexOf(0), 1);
			this.dripFlowDetailsForm.controls['learnerGroup'].setValue(learnerGroupIds);
			$('#confirmationModal').modal('show');
		} else {
			this.selected_learner_group = [];
			this.learner_group_for_add_to_group = [];
			for (let learnerGroupId of this.dripFlowDetailsForm.controls['learnerGroup'].value) {
				for (let learnerGroup of this.learnerGroupList) {
					if (learnerGroup.id == learnerGroupId) {
						this.selected_learner_group.push(learnerGroup);
					} else if (!learnerGroup.defaultGroupForDrip && !learnerGroup.defaultGroupForDiwo) {
						this.learner_group_for_add_to_group.push(learnerGroup);
					}
				}
			}
		}
	}

	selectLearnerGroupForAction(event) {
		let flag = false;
		let selectAll = false;
		for (let data of event) {
			if (data.id == 0) {
				flag = true;
			} else if (data.id == -1) {
				selectAll = true;
			}
		}
		if (selectAll) {
			let learnerGroupIds = this.dripFlowDripForm.controls['groupForAction'].value;
			if (learnerGroupIds.indexOf(0) > -1) {
				learnerGroupIds.splice(learnerGroupIds.indexOf(0), 1);
			}
			if (learnerGroupIds.indexOf(-1) > -1) {
				learnerGroupIds.splice(learnerGroupIds.indexOf(-1), 1);
			}

			this.dripFlowDripForm.controls['groupForAction'].setValue(learnerGroupIds);

			if (this.dripFlowDripForm.controls['groupForAction'].value.length > 0) {
				this.dripFlowDripForm.controls['groupForAction'].setValue(null);
			} else {
				this.dripFlowDripForm.controls['groupForAction'].setValue(null);
				let group = [];
				for (let learnerGroup of this.learnerGroupList) {
					if (learnerGroup.id != 0 && learnerGroup.id != -1) {
						group.push(learnerGroup.id);
					}
				}
				this.dripFlowDripForm.controls['groupForAction'].setValue(group);
			}
		} else if (flag) {
			let learnerGroupIds = this.dripFlowDripForm.controls['groupForAction'].value;
			learnerGroupIds.splice(learnerGroupIds.indexOf(0), 1);
			this.dripFlowDripForm.controls['groupForAction'].setValue(learnerGroupIds);
			$('#confirmationModal').modal('show');
		}

		if (event[0].id == 0) {
			$('#confirmationModal').modal('show');
		}
	}

	checkFormValidition(formName) {
		if (
			(this.dripFlowDetailsForm.controls[formName].value == '' ||
				this.dripFlowDetailsForm.controls[formName].value == null) &&
			this.dripFlowDetailsForm.controls[formName].value != 0
		) {
			this.dripFlowDetailsForm.controls[formName].setErrors({ required: true });
			this.dripFlowDetailsForm.controls[formName].markAsTouched({ onlySelf: true });
			return true;
		} else {
			return false;
		}
	}

	saveDripFlow(status) {
		this.drip_flow_status = status;
		let flag = false;
		let showMilestonePopup = false;
		if (this.checkFormValidition('title')) {
			flag = true;
		}
		if (this.checkFormValidition('startRule')) {
			flag = true;
		}
		if (this.checkFormValidition('learnerGroup')) {
			flag = true;
		}

		if (this.allParamsData.redictfrom == 'learnerGroup' || this.allParamsData.redictfrom == 'contactGroup') {
			if (
				this.dripFlow_Data.campaignDetails.learnerGroup &&
				this.dripFlow_Data.campaignDetails.learnerGroup.length == 0
			) {
				this.dripFlowDetailsForm.controls['learnerGroup'].setErrors({ required: true });
				this.dripFlowDetailsForm.controls['learnerGroup'].markAsTouched({ onlySelf: true });
				flag = true;
				return true;
			}
		}

		//For Start Rule
		if (this.dripFlowDetailsForm.value.startRule == 'Start on date') {
			if (this.checkFormValidition('startDate')) {
				flag = true;
			}
			if (this.checkFormValidition('startTimeId')) {
				flag = true;
			}
			if (this.checkFormValidition('endDate')) {
				flag = true;
			}
			if (this.checkFormValidition('endTimeId')) {
				flag = true;
			}
			if (this.dripFlowDetailsForm.value.startDate.startDate > this.dripFlowDetailsForm.value.endDate.startDate) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.endDateafterstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				return;
			}
		} else if (this.dripFlowDetailsForm.value.startRule == 'Start when learner is added to group') {
			// if (this.checkFormValidition('learnerGroupForRule')) {
			// 	flag = true;
			// }
			if (this.checkFormValidition('endDate')) {
				flag = true;
			}
			if (this.checkFormValidition('endTimeId')) {
				flag = true;
			}
		} else if (this.dripFlowDetailsForm.value.startRule == 'Start when tag is added to learner') {
			if (this.checkFormValidition('tags')) {
				flag = true;
			}
			if (this.checkFormValidition('operator')) {
				flag = true;
			}
			if (this.checkFormValidition('endDate')) {
				flag = true;
			}
			if (this.checkFormValidition('endTimeId')) {
				flag = true;
			}
		}

		if (this.successMetricsList.length > 0) {
			this.dripFlowDetailsForm.controls['successMetricsList'].setValue(this.successMetricsList);
		} else {
			this.dripFlowDetailsForm.controls['successMetricsList'].setValue([]);
		}

		//Need To check Once More
		for (let drip of this.selectedDripForDripFlow) {
			if (drip.dripFlowType == 'Send a Drip') {
				if (drip.dripType == null || drip.dripId == null || drip.dripTriggerRule == null) {
					flag = true;
				}

				if (drip.dripTriggerRule == 'Send on date') {
					if (drip.dripTriggerDate == null || drip.dripTriggerTimeId == null) {
						flag = true;
						this.toastr.error(
							this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripDateNotSelected'),
							this.appService.getTranslation('Utils.error')
						);
					}
				} else if (drip.dripTriggerRule == 'Send based on system activity') {
					if (drip.systemActionType == null) {
						flag = true;
					}
					if (drip.systemActionType == 'Based on drip sent' && drip.dependencyDripIndex == null) {
						flag = true;
					} else if (drip.systemActionType == 'Based on previous action taken' && drip.dependencyDripIndex == null) {
						flag = true;
					} else if (drip.systemActionType == 'Based on tags added' && drip.tagsForSystemAction == null) {
						flag = true;
					}
				} else if (
					drip.dripTriggerRule == 'Send based on user activity' &&
					(drip.userAction == null || drip.dependencyDripIndex == null)
				) {
					flag = true;
				} else if (drip.dripTriggerRule === 'Send based on contact milestone') {
					showMilestonePopup = true;
					if (drip.milestoneField == null) {
						flag = true;
					} else if (drip.dripTriggerTimeId == null) {
						flag = true;
					}
				}
			} else if (drip.dripFlowType == 'Take Action') {
				if (drip.actionType == null) {
					flag = true;
				}

				if (drip.actionType == 'Unlicense learner') {
				} else if (drip.actionType == 'Add to group' && drip.groupForAction == null) {
					flag = true;
				} else if (drip.actionType == 'Delete from group' && drip.groupForAction == null) {
					flag = true;
				} else if (drip.actionType == 'Add Tag' && drip.tagsForAction == null) {
					flag = true;
				} else if (drip.actionType == 'Delete Tag' && drip.tagsForAction == null) {
					flag = true;
				}
				if (drip.actionTriggerRule == null) {
					flag = true;
				}

				if (
					drip.actionTriggerRule == 'Take action on date' &&
					(drip.dripTriggerDate == null || drip.dripTriggerTimeId == null)
				) {
					flag = true;
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.actionDateNotSelected'),
						this.appService.getTranslation('Utils.error')
					);
				} else if (drip.actionTriggerRule == 'Take action based on system activity' && drip.systemActionType == null) {
					flag = true;
					if (drip.systemActionType == 'Based on drip sent' && drip.dependencyDripIndex == null) {
						flag = true;
					} else if (drip.systemActionType == 'Based on previous action taken' && drip.dependencyDripIndex == null) {
						flag = true;
					} else if (drip.systemActionType == 'Based on tags added' && drip.tagsForSystemAction == null) {
						flag = true;
					}
				} else if (
					drip.actionTriggerRule == 'Take action based on user activity' &&
					(drip.dependencyDripIndex == null || drip.userAction == null)
				) {
					flag = true;
					if (drip.userAction == 'Activity Outcome' && (drip.activityScoreType == null || drip.score == null)) {
						flag = true;
					}
				}
			}
		}

		if (flag) {
			return;
		}

		if (this.selectedDripForDripFlow && this.selectedDripForDripFlow.length <= 0) {
			this.toastr.error(
				this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.atleastonedrip'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}

		let payload = {
			campaignDetails: this.dripFlowDetailsForm.value,
			dripDetails: this.selectedDripForDripFlow,
			ClientId: this.selectedClientId,
			isChannelFlow: this.isChannelFlow,
			channelDetails: this.campChannelMappingList,
		};

		if (status == false) {
			payload.campaignDetails.status = 'Draft';
		} else {
			payload.campaignDetails.status = 'Scheduled';
		}
		localStorage.removeItem('temp_dripflow_payload');
		if (payload.campaignDetails.startRule === 'Start when learner is added to group')
			payload.campaignDetails.learnerGroupForRule = payload.campaignDetails.learnerGroup;

		if (
			(this.dripFlowDetailsForm.value.endDate && this.dripFlowDetailsForm.value.endDate.startDate != undefined) ||
			(this.dripFlowDetailsForm.value.endDate && this.dripFlowDetailsForm.value.endDate.startDate != null)
		) {
			payload.campaignDetails.endDate = this.dripFlowDetailsForm.value.endDate.startDate.format('YYYY-MM-DD');
		}

		if (
			(this.dripFlowDetailsForm.value.startDate && this.dripFlowDetailsForm.value.startDate.startDate != undefined) ||
			(this.dripFlowDetailsForm.value.startDate && this.dripFlowDetailsForm.value.startDate.startDate != null)
		) {
			payload.campaignDetails.startDate = this.dripFlowDetailsForm.value.startDate.startDate.format('YYYY-MM-DD');
		}

		if (payload.campaignDetails && payload.campaignDetails.startDate && payload.campaignDetails.startTimeId) {
			payload.campaignDetails.startDate = this.getDateByDateAndTimePickerId(
				payload.campaignDetails.startDate,
				payload.campaignDetails.startTimeId
			);
		}

		if (payload.campaignDetails && payload.campaignDetails.endDate) {
			payload.campaignDetails.endDate = this.getDateByDateAndTimePickerId(
				payload.campaignDetails.endDate,
				payload.campaignDetails.endTimeId
			);
		}

		for (let i in payload.dripDetails) {
			if (
				payload.dripDetails[i] &&
				payload.dripDetails[i].dripTriggerDate &&
				payload.dripDetails[i].dripTriggerTimeId
			) {
				payload.dripDetails[i].dripTriggerDate = this.getDateByDateAndTimePickerId(
					payload.dripDetails[i].dripTriggerDate,
					payload.dripDetails[i].dripTriggerTimeId
				);
			}

			// if (
			// 	payload.dripDetails[i] &&
			// 	payload.dripDetails[i].dripActionEndDate &&
			// 	payload.dripDetails[i].dripActionEndTimeId
			// ) {
			// 	payload.dripDetails[i].dripActionEndDate = this.getDateByDateAndTimePickerId(
			// 		payload.dripDetails[i].dripActionEndDate,
			// 		payload.dripDetails[i].dripActionEndTimeId
			// 	);
			// }
		}
		if (payload.campaignDetails.startRule === 'Start on date') {
			for (let drip of this.selectedDripForDripFlow) {
				let dripTriggerDate = drip.dripTriggerDate ? moment(drip.dripTriggerDate).format() : null;
				if (dripTriggerDate === 'Invalid date') {
					dripTriggerDate = null;
				}
				let startDate = moment(payload.campaignDetails.startDate).format();
				let endDate = moment(payload.campaignDetails.endDate).format();
				// console.log('dripTriggerDate', dripTriggerDate);
				// console.log('startDate', startDate);
				// console.log('endDate', endDate);

				if (
					dripTriggerDate &&
					(!moment(payload.campaignDetails.startDate).isSameOrBefore(dripTriggerDate) ||
						!moment(payload.campaignDetails.endDate).isSameOrAfter(dripTriggerDate)) &&
					drip.dripTriggerRule != 'Send based on contact milestone'
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.invalidDripStartDate'),
						this.appService.getTranslation('Utils.error')
					);
					return;
				}
			}
		}

		if (
			payload.campaignDetails.startRule === 'Start on date' &&
			payload.campaignDetails.startDate &&
			moment().isSameOrAfter(payload.campaignDetails.startDate)
		) {
			this.toastr.error(
				this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.invalidDripFlowStartDate'),
				this.appService.getTranslation('Utils.error')
			);
			return;
		}

		if (this.showContantMilestoneConformationPop == false && showMilestonePopup == true) {
			//Show popup for confirmation
			this.showContantMilestoneConformationPop = true;
			$('#contactMilestoneModel').modal('show');
			return;
		} else {
			$('#contactMilestoneModel').modal('hide');
		}

		this.spinnerService.show();

		if (this.dripFlowDetailsForm.value.id == null) {
			this.dripFlowService
				.createCampaign(payload, this.selectedClientId, this.userId, this.userRoleId)
				.subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.spinnerService.hide();
						if (status == true) {
							this.toastr.success(
								this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripflowcreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripflowsaveasdraft'),
								this.appService.getTranslation('Utils.success')
							);
						}
						this.router.navigate(['/drip-flows']);
					} else {
						this.spinnerService.hide();
						this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
						this.router.navigate(['/drip-flows']);
					}
				});
		} else {
			this.savePagination();
			this.dripFlowService
				.updateCampaign(this.dripFlowDetailsForm.value.id, payload, this.selectedClientId, this.userId, this.userRoleId)
				.subscribe((res: any) => {
					if (res.success) {
						this.appService.checkNotifcation = true;
						this.spinnerService.hide();
						if (status == true) {
							this.toastr.success(
								this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripflowcreated'),
								this.appService.getTranslation('Utils.success')
							);
						} else {
							this.toastr.success(
								this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripflowsaveasdraft'),
								this.appService.getTranslation('Utils.success')
							);
						}
						setTimeout(() => {
							this.router.navigate(['/drip-flows']);
						}, 100);
					} else {
						this.spinnerService.hide();
						this.toastr.success(res.error, this.appService.getTranslation('Utils.error'));
						setTimeout(() => {
							this.router.navigate(['/drip-flows']);
						}, 100);
					}
				});
		}
	}

	saveAsDraft() {}

	cancelMilestonePopup() {
		this.showContantMilestoneConformationPop = false;
		$('#contactMilestoneModel').modal('hide');
	}

	createNewGroup() {
		if (this.dripFlowDetailsForm.invalid) {
			this.markAsTouched(this.dripFlowDetailsForm);
			return;
		}
	}

	selectTimeIntoDrip() {
		for (let time of this.timePicker) {
			if (this.dripFlowDripForm.controls['dripTriggerTimeId'].value == time.id) {
				this.dripFlowDripForm.controls['dripTriggerActualTime'].setValue(time.time);
			}
		}
	}

	async selectDependancyDrip(event) {
		// console.log('------event', event);
		if (event) {
			this.showQuickReplyList = false;

			if (event?.showTrackableLink) {
				this.showTrackingLink = true;
			} else {
				this.showTrackingLink = false;
			}

			if (event && event.quickReplyList && event.quickReplyList.length > 0) {
				this.quickReplayList = event.quickReplyList;
				this.showQuickReplyList = true;
			} else if (event?.Post?.Drip_whatsapp_natives && event?.Post?.Drip_whatsapp_natives.length > 0) {
				this.quickReplayList = event.Post.Drip_whatsapp_natives;
				if (
					event.Post.Drip_whatsapp_natives[0].trackableLink ||
					event.Post.Drip_whatsapp_natives[0].trackableLink2 ||
					event.Post.Drip_whatsapp_natives[0].zoomTrackable ||
					event.Post.Drip_whatsapp_natives[0].zoomTrackable2
				) {
					this.showTrackingLink = true;
				} else {
					this.showTrackingLink = false;
				}
				let quickReply = [];
				for (let i = 1; i <= 10; i++) {
					if (event.Post.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
						quickReply.push({ label: event.Post.Drip_whatsapp_natives[0]['quickReply' + i], PostId: event.Post.id });
					}
				}
				if (quickReply.length > 0) {
					this.quickReplayList = quickReply;
					this.showQuickReplyList = true;
				}
			} else if (event?.Post?.DripOnlyTeams && event?.Post?.DripOnlyTeams.length > 0) {
				if (
					event.Post.DripOnlyTeams[0].trackableLink1 ||
					event.Post.DripOnlyTeams[0].trackableLink2 ||
					event.Post.DripOnlyTeams[0].trackableLink3
				) {
					this.showTrackingLink = true;
				} else {
					this.showTrackingLink = false;
				}
			}

			this.dripFlowDripForm.controls['dependencyIndex'].setValue(event.index);
			this.dependancyDrip = event;
			// console.log('------dependancyDrip', this.dependancyDrip);

			if (this.dripFlowDripForm.controls['dripTriggerRule'].value === 'Send based on user activity') {
				this.showUserActivityScoreDDOption = false;
				this.showImageDripOption = true;
				this.showPoolOption = false;
				this.showQuestionList = false;
				this.questionList = [];
				await this.postService.getDripByDripId(event.dripId).subscribe((res: any) => {
					if (res.success) {
						const dripData = res.data;
						if (dripData.tempType === 'Quiz' || dripData.tempType === 'Quiz (Randomised)') {
							this.showUserActivityScoreDDOption = true;
							this.showPoolOption = false;
							this.showQuickReplyList = false;
							if (dripData.tempType === 'Quiz') {
								this.scoreLimit = dripData.DripQuestions.length * 2;
							} else {
								this.scoreLimit = dripData.quizRandCount * 2;
							}
						} else if (dripData.tempType == 'Poll') {
							this.showUserActivityScoreDDOption = true;
							this.showQuickReplyList = false;
							this.showPoolOption = true;
							this.pool_activity_option_list = [];
							for (let option of dripData.DripQuestions[0].DripOptions) {
								this.pool_activity_option_list.push({ name: option.text });
							}
						} else if (dripData.tempType === 'Survey') {
							// First Check Survey have MCQ or Rataing Scale is present or not
							//If MCQ or Rating Scale is Present then Show New DD of Question List
							//If selected Question Type is MCQ then Show New DD with List Of Options
							//If selected Question Type is Rating Scale then Show Less that, Greater than and Equal to DD and Value input

							for (let question of dripData.DripQuestions) {
								if (['MCQ', 'Rating scale', 'Drop Down'].indexOf(question.questionType) > -1) {
									this.showUserActivityScoreDDOption = true;
									this.showQuestionList = true;
									this.questionList.push(question);
								}
							}
						} else if (dripData.tempType == 'Single Image') {
							this.showImageDripOption = false;
							this.showQuickReplyList = false;
						}
					}
				});
			}
		} else {
			this.dependancyDrip = null;
			this.dependancyDrip = { dripType: null };
			this.dripFlowDripForm.controls['dependencyIndex'].setValue(null);
		}
	}

	async selectDependancyDripInAction(event, temp) {
		if (event) {
			this.showQuickReplyList = false;

			this.selctedRatingScaleQuestion = false;

			if (event?.showTrackableLink) {
				this.showTrackingLink = true;
			} else {
				this.showTrackingLink = false;
			}

			if (event && event.quickReplyList && event.quickReplyList.length > 0) {
				this.quickReplayList = event.quickReplyList;
				this.showQuickReplyList = true;
			} else if (event?.Post?.Drip_whatsapp_natives && event?.Post?.Drip_whatsapp_natives.length > 0) {
				this.quickReplayList = event.Post.Drip_whatsapp_natives;

				if (
					event.Post.Drip_whatsapp_natives[0].trackableLink ||
					event.Post.Drip_whatsapp_natives[0].trackableLink2 ||
					event.Post.Drip_whatsapp_natives[0].zoomTrackable ||
					event.Post.Drip_whatsapp_natives[0].zoomTrackable2
				) {
					this.showTrackingLink = true;
				} else {
					this.showTrackingLink = false;
				}

				let quickReply = [];
				for (let i = 1; i <= 10; i++) {
					if (event.Post.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
						quickReply.push({ label: event.Post.Drip_whatsapp_natives[0]['quickReply' + i], PostId: event.Post.id });
					}
				}
				if (quickReply.length > 0) {
					this.quickReplayList = quickReply;
					this.showQuickReplyList = true;
				}
			} else if (event?.Post?.DripOnlyTeams && event?.Post?.DripOnlyTeams.length > 0) {
				if (
					event.Post.DripOnlyTeams[0].trackableLink1 ||
					event.Post.DripOnlyTeams[0].trackableLink2 ||
					event.Post.DripOnlyTeams[0].trackableLink3
				) {
					this.showTrackingLink = true;
				} else {
					this.showTrackingLink = false;
				}
			}

			this.dripFlowDripForm.controls['dependencyIndex'].setValue(event.index);
			this.dependancyDrip = event;
			if (
				(temp && temp.actionTriggerRule === 'Take action based on user activity') ||
				this.dripFlowDripForm.controls['actionTriggerRule'].value === 'Take action based on user activity'
			) {
				this.showUserActivityScoreDDOption = false;
				this.showPoolOption = false;
				this.showImageDripOption = true;
				await this.postService.getDripByDripId(event.dripId).subscribe((res: any) => {
					if (res.success) {
						const dripData = res.data;
						if (dripData.tempType === 'Quiz' || dripData.tempType === 'Quiz (Randomised)') {
							this.showUserActivityScoreDDOption = true;
							this.showPoolOption = false;
							if (dripData.tempType === 'Quiz') {
								this.scoreLimit = dripData.DripQuestions.length * 2;
							} else {
								this.scoreLimit = dripData.quizRandCount * 2;
							}
						} else if (dripData.tempType == 'Poll') {
							this.showUserActivityScoreDDOption = true;
							this.showPoolOption = true;
							this.pool_activity_option_list = [];
							for (let option of dripData.DripQuestions[0].DripOptions) {
								this.pool_activity_option_list.push({ name: option.text });
							}
						} else if (dripData.tempType == 'Single Image') {
							this.showImageDripOption = false;
						}
					}
				});
			}
		} else {
			this.dripFlowDripForm.controls['dependencyIndex'].setValue(null);
		}
	}

	async editDrip(index, status) {
		if (index === 0) {
			this.showUserActivityBaseOption = false;
		} else {
			this.showUserActivityBaseOption = true;
		}
		this.dripStatus = status;
		let allowStatus = ['Scheduled', 'PFA'];
		if (allowStatus.indexOf(this.selectedDripForDripFlow[index].status) > -1) {
			this.editDripIndex = index;
			this.selectedDripIndex = index + 1;
			this.getPostListByPostType({
				name: this.selectedDripForDripFlow[index].dripType,
			});
			this.scrollList = document.getElementById('dripSelctionForm');
			this.scrollList.scrollIntoView({ behavior: 'smooth' });
			this.dripFlowDripForm.reset();
			await this.createdripFlowDripForm();

			let temp = this.selectedDripForDripFlow[index];

			temp.poolOptionType =
				this.selectedDripForDripFlow[index].pollOption || this.selectedDripForDripFlow[index].poolOptionType;
			//if (temp.dripActionEndDate) temp.dripActionEndTimeId = this.getTimePikerIdByDate(temp.dripActionEndDate);

			let event = { name: temp.dripType };
			this.selecteddripTriggerDate = null;
			this.selecteddripActionDate = null;
			await this.postService
				.getAllPostsByClientAndPostType(this.selectedClientId, event.name, this.isChannelFlow)
				.subscribe((res: any) => {
					if (res.success) {
						let tempList = [];
						tempList.push({ id: 0, drip_title: 'Create New Drip' });
						res.data.filter((drip) => {
							if (drip.is_deleted == false) {
								tempList.push(drip);
							}
						});
						this.allDripList = tempList;
						if (temp.userAction === 'Activity Outcome') {
							let pre = this.selectedDripForDripFlow[temp.dependencyDripIndex];
							this.showImageDripOption = true;
							// this.showQuickReplyList = false;
							for (let tempDrip of this.allDripList) {
								if (pre.dripId == tempDrip.id && (pre.tempType === 'Quiz' || pre.tempType === 'Quiz (Randomised)')) {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = false;
									this.showQuickReplyList = false;
									this.showTrackingLink = false;
									if (pre.tempType === 'Quiz') {
										this.scoreLimit = tempDrip.DripQuestions.length * 2;
									} else {
										this.scoreLimit = tempDrip.quizRandCount * 2;
									}
								} else if (pre.dripId == tempDrip.id && pre.tempType == 'Poll') {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = true;
									this.showQuickReplyList = false;
									this.showTrackingLink = false;
									this.pool_activity_option_list = [];
									for (let option of tempDrip.DripQuestions[0].DripOptions) {
										this.pool_activity_option_list.push({ name: option.text });
									}
								} else if (pre.dripId == tempDrip.id && pre.tempType === 'Single Image') {
									this.showImageDripOption = false;
									this.showQuickReplyList = false;
									this.showTrackingLink = false;
								} else if (pre.dripId == tempDrip.id && pre.tempType === 'Survey') {
									this.questionList = [];
									this.showTrackingLink = false;
									for (let question of tempDrip.DripQuestions) {
										if (['MCQ', 'Rating scale', 'Drop Down'].indexOf(question.questionType) > -1) {
											this.showUserActivityScoreDDOption = true;
											this.showQuestionList = true;
											this.questionList.push(question);
											if (question.id === this.selectedDripForDripFlow[index].DripQuestionId) {
												this.selectQuestion(question);
											}
										}
									}
								}
								if (pre.dripId == tempDrip.id && pre?.Post?.Drip_whatsapp_natives.length > 0) {
									if (
										pre.Post.Drip_whatsapp_natives[0].trackableLink ||
										pre.Post.Drip_whatsapp_natives[0].trackableLink2 ||
										pre.Post.Drip_whatsapp_natives[0].zoomTrackable ||
										pre.Post.Drip_whatsapp_natives[0].zoomTrackable2
									) {
										this.showTrackingLink = true;
									} else {
										this.showTrackingLink = false;
									}

									// console.log('----------------------Checking Quick Reply-----------------');

									let quickReply = [];

									for (let i = 1; i <= 10; i++) {
										if (pre.Post.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
											quickReply.push({ label: pre.Post.Drip_whatsapp_natives[0]['quickReply' + i], PostId: pre.id });
										}
									}
									if (quickReply.length > 0) {
										this.quickReplayList = quickReply;
										this.showQuickReplyList = true;
									}
								} else if (pre.dripId == tempDrip.id && pre?.Post?.DripOnlyTeams.length > 0) {
									if (
										pre.Post.DripOnlyTeams[0].trackableLink1 ||
										pre.Post.DripOnlyTeams[0].trackableLink2 ||
										pre.Post.DripOnlyTeams[0].trackableLink3
									) {
										this.showTrackingLink = true;
									} else {
										this.showTrackingLink = false;
									}
								}
							}
						}
						if (event && event.name && event.name.includes('WhatsApp')) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(true);
						} else if (event && event.name) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(false);
							this.dripFlowDripForm.controls['templateStatus'].setValue(null);
						}
					}
				});

			this.dripFlowDripForm.patchValue(temp);
			if (temp.dripTriggerRule === 'Send based on user activity') {
				await this.selectDependancyDrip(this.selectedDripForDripFlow[temp.dependencyDripIndex]);
			}

			if (temp.dripTriggerRule === 'Send based on contact milestone') {
				this.dripFlowDripForm.controls['dripTriggerDate'].setValue(new Date());
			}
			if (temp.actionTriggerRule === 'Take action based on user activity') {
				await this.selectDependancyDripInAction(this.selectedDripForDripFlow[temp.dependencyDripIndex], temp);
			}

			if (this.selectedDripForDripFlow[index].dripTriggerDate != null) {
				setTimeout(() => {
					this.selecteddripTriggerDate = {
						startDate: moment(this.selectedDripForDripFlow[index].dripTriggerDate).subtract(0, 'days').startOf('day'),
						endDate: moment(this.selectedDripForDripFlow[index].dripTriggerDate).subtract(0, 'days').startOf('day'),
					};
				}, 200);
			}

			// if (this.selectedDripForDripFlow[index].dripActionEndDate != null) {
			// 	setTimeout(() => {
			// 		this.selecteddripActionDate = {
			// 			startDate: moment(this.selectedDripForDripFlow[index].dripActionEndDate).subtract(0, 'days').startOf('day'),
			// 			endDate: moment(this.selectedDripForDripFlow[index].dripActionEndDate).subtract(0, 'days').startOf('day'),
			// 		};
			// 	}, 200);
			// }
			this.updateDependencyDripList(this.selectedDripForDripFlow[index]);
		} else {
			return;
		}
	}

	async viewDrip(index, status) {
		if (index === 0) {
			this.showUserActivityBaseOption = false;
		} else {
			this.showUserActivityBaseOption = true;
		}
		this.dripStatus = status;
		let allowStatus = ['Delivering', 'Delivered', 'Performing', 'Performed'];
		if (allowStatus.indexOf(this.selectedDripForDripFlow[index].status) > -1) {
			this.editDripIndex = index;
			this.selectedDripIndex = index + 1;
			this.getPostListByPostType({
				name: this.selectedDripForDripFlow[index].dripType,
			});
			this.scrollList = document.getElementById('dripSelctionForm');
			this.scrollList.scrollIntoView({ behavior: 'smooth' });
			this.dripFlowDripForm.reset();
			this.createdripFlowDripForm();
			let temp = this.selectedDripForDripFlow[index];
			this.selecteddripTriggerDate = null;
			temp.poolOptionType =
				this.selectedDripForDripFlow[index].pollOption || this.selectedDripForDripFlow[index].poolOptionType;
			//if (temp.dripActionEndDate) temp.dripActionEndTimeId = this.getTimePikerIdByDate(temp.dripActionEndDate);

			let event = { name: temp.dripType };
			await this.postService
				.getAllPostsByClientAndPostType(this.selectedClientId, event.name, this.isChannelFlow)
				.subscribe((res: any) => {
					if (res.success) {
						let tempList = [];
						tempList.push({ id: 0, drip_title: 'Create New Drip' });
						res.data.filter((drip) => {
							if (drip.is_deleted == false) {
								tempList.push(drip);
							}
						});
						this.allDripList = tempList;
						if (temp.userAction === 'Activity Outcome') {
							let pre = this.selectedDripForDripFlow[temp.dependencyDripIndex];
							this.showImageDripOption = true;
							for (let tempDrip of this.allDripList) {
								if (pre.dripId == tempDrip.id && (pre.tempType === 'Quiz' || pre.tempType === 'Quiz (Randomised)')) {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = false;
									this.showQuickReplyList = false;
									this.showTrackingLink = false;
									if (pre.tempType === 'Quiz') {
										this.scoreLimit = tempDrip.DripQuestions.length * 2;
									} else {
										this.scoreLimit = tempDrip.quizRandCount * 2;
									}
								} else if (pre.dripId == tempDrip.id && pre.tempType == 'Poll') {
									this.showUserActivityScoreDDOption = true;
									this.showPoolOption = true;
									this.showQuickReplyList = false;
									this.pool_activity_option_list = [];
									this.showTrackingLink = false;
									for (let option of tempDrip.DripQuestions[0].DripOptions) {
										this.pool_activity_option_list.push({ name: option.text });
									}
								} else if (pre.dripId == tempDrip.id && pre.tempType === 'Single Image') {
									this.showImageDripOption = false;
									this.showQuickReplyList = false;
									this.showTrackingLink = false;
								} else if (pre.dripId == tempDrip.id && pre.tempType === 'Survey') {
									this.questionList = [];
									this.showTrackingLink = false;
									for (let question of tempDrip.DripQuestions) {
										if (['MCQ', 'Rating scale', 'Drop Down'].indexOf(question.questionType) > -1) {
											this.showUserActivityScoreDDOption = true;
											this.showQuestionList = true;
											this.questionList.push(question);
											if (question.id === this.selectedDripForDripFlow[index].DripQuestionId) {
												this.selectQuestion(question);
											}
										}
									}
								}
								if (pre.dripId == tempDrip.id && pre?.Post?.Drip_whatsapp_natives.length > 0) {
									// console.log('----------------------Checking Trackble Link-----------------');
									if (
										pre.Post.Drip_whatsapp_natives[0].trackableLink ||
										pre.Post.Drip_whatsapp_natives[0].trackableLink2 ||
										pre.Post.Drip_whatsapp_natives[0].zoomTrackable ||
										pre.Post.Drip_whatsapp_natives[0].zoomTrackable2
									) {
										this.showTrackingLink = true;
									} else {
										this.showTrackingLink = false;
									}

									// console.log('----------------------Checking Quick Reply-----------------');
									let quickReply = [];
									for (let i = 1; i <= 10; i++) {
										if (pre.Post.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
											quickReply.push({ label: pre.Post.Drip_whatsapp_natives[0]['quickReply' + i], PostId: pre.id });
										}
									}
									if (quickReply.length > 0) {
										this.quickReplayList = quickReply;
										this.showQuickReplyList = true;
									}
								} else if (pre.dripId == tempDrip.id && pre?.Post?.DripOnlyTeams.length > 0) {
									if (
										pre.Post.DripOnlyTeams[0].trackableLink1 ||
										pre.Post.DripOnlyTeams[0].trackableLink2 ||
										pre.Post.DripOnlyTeams[0].trackableLink3
									) {
										this.showTrackingLink = true;
									} else {
										this.showTrackingLink = false;
									}
								}
							}
						}
						if (event && event.name && event.name.includes('WhatsApp')) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(true);
						} else if (event && event.name) {
							this.dripFlowDripForm.controls['whatsAppTemplateFlag'].setValue(false);
							this.dripFlowDripForm.controls['templateStatus'].setValue(null);
						}
					}
				});

			this.dripFlowDripForm.patchValue(temp);
			if (temp.dripTriggerRule === 'Send based on user activity') {
				this.selectDependancyDrip(this.selectedDripForDripFlow[temp.dependencyDripIndex]);
			}
			if (temp.actionTriggerRule === 'Take action based on user activity') {
				this.selectDependancyDripInAction(this.selectedDripForDripFlow[temp.dependencyDripIndex], temp);
			}
			if (this.selectedDripForDripFlow[index].dripTriggerDate != null) {
				setTimeout(() => {
					this.selecteddripTriggerDate = {
						startDate: moment(this.selectedDripForDripFlow[index].dripTriggerDate).subtract(0, 'days').startOf('day'),
						endDate: moment(this.selectedDripForDripFlow[index].dripTriggerDate).subtract(0, 'days').startOf('day'),
					};
				}, 200);
			}

			// if (this.selectedDripForDripFlow[index].dripActionEndDate != null) {
			// 	setTimeout(() => {
			// 		this.selecteddripActionDate = {
			// 			startDate: moment(this.selectedDripForDripFlow[index].dripActionEndDate).subtract(0, 'days').startOf('day'),
			// 			endDate: moment(this.selectedDripForDripFlow[index].dripActionEndDate).subtract(0, 'days').startOf('day'),
			// 		};
			// 	}, 200);
			// }

			this.updateDependencyDripList(this.selectedDripForDripFlow[index]);
			this.dripFlowDripForm.disable();
		} else {
			return;
		}
	}

	remove(index) {
		//Edit to remove
		// console.log('--selected_send_a_drip_list--', this.selected_send_a_drip_list);
		for (let i = 0; i < this.selected_send_a_drip_list.length; i++) {
			if (this.selected_send_a_drip_list[i].index == index) {
				this.selected_send_a_drip_list.splice(i, 1);
			}
		}
		// console.log('--this.selectedDripForDripFlow[index]--', this.selectedDripForDripFlow[index]);
		let allowStatus = ['Scheduled', 'PFA'];
		if (allowStatus.indexOf(this.selectedDripForDripFlow[index].status) > -1) {
			let count = 0;
			for (let i = 0; i < this.selectedDripForDripFlow.length; i++) {
				if (this.selectedDripForDripFlow[i].status != 'Removed') {
					this.selectedDripForDripFlow[i].index = count;
					count++;
				}
				if (
					i == 0 ||
					this.selectedDripForDripFlow[i].dependencyDripIndex == this.selectedDripForDripFlow[index].index
				) {
					this.selectedDripForDripFlow[i].dependencyDripIndex = null;
					this.selectedDripForDripFlow[i].userAction = null;
				}
			}
			if (!this.editDripFlag) {
				this.selectedDripForDripFlow.splice(index, 1);
				this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;
			} else {
				this.toastr.success(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.dripremoved'),
					this.appService.getTranslation('Utils.success')
				);
				this.selectedDripForDripFlow[index].status = 'Removed';
			}
			this.showUserActivityBaseOption = false;
			for (let temp of this.selectedDripForDripFlow) {
				if (temp.dripFlowType == 'Send a Drip') {
					this.showUserActivityBaseOption = true;
				}
			}
		} else {
			return;
		}
	}

	cancelEdit() {
		this.editDripIndex = null;
		this.dripFlowDripForm.reset();
		this.createdripFlowDripForm();
		this.allDripList = [];
		this.selectedDripIndex = this.selectedDripForDripFlow.length + 1;
		this.selected_send_a_drip_list = [];
		this.dependancyDrip = null;
		for (let drip of this.selectedDripForDripFlow) {
			this.selected_send_a_drip_list.push(drip);
		}
		this.showUserActivityBaseOption = true;
	}

	updateDependencyDripList(drip) {
		if (this.editDripIndex) {
			this.selected_send_a_drip_list = [];
			this.selected_take_action_list = [];
			this.selected_send_drip_and_take_action_list = [];
			for (let i = 0; i < this.selectedDripForDripFlow.length; i++) {
				if (
					this.selectedDripForDripFlow[i].dripFlowType == 'Send a Drip' &&
					this.selectedDripForDripFlow[i].status != 'Removed'
				) {
					let _drip = this.selectedDripForDripFlow[i];
					_drip.index = i;
					// _drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.dripTitleName;
					_drip.dripDropDownTitle = _drip.dripName;

					this.selected_send_a_drip_list.push(_drip);
					this.selected_send_drip_and_take_action_list.push(_drip);
				} else if (this.selectedDripForDripFlow[i].status != 'Removed') {
					let _drip = this.selectedDripForDripFlow[i];
					_drip.index = i;
					// _drip.dripDropDownTitle = _drip.dripName + ' - ' + _drip.actionType;
					_drip.dripDropDownTitle = _drip.dripName;
					this.selected_take_action_list.push(_drip);
					this.selected_send_drip_and_take_action_list.push(_drip);
				}
			}
		}

		let temp_1 = this.selected_send_drip_and_take_action_list;
		let temp_2 = this.selected_send_a_drip_list;
		this.selected_send_drip_and_take_action_list = [];
		this.selected_send_a_drip_list = [];
		this.selected_take_action_list = [];
		this.selected_activity_send_a_drip_list = [];

		for (let temp of temp_1) {
			if (drip.index != temp.index) {
				this.selected_send_drip_and_take_action_list.push(temp);
				if (temp.dripFlowType == 'Send a Drip') {
					this.selected_send_a_drip_list.push(temp);
					this.selected_activity_send_a_drip_list;
				} else {
					this.selected_take_action_list.push(temp);
				}
			}
		}
	}

	checkValidationOnDate() {
		let payload = {
			campaignDetails: this.dripFlowDetailsForm.value,
		};

		if (
			(this.dripFlowDetailsForm.value.endDate && this.dripFlowDetailsForm.value.endDate.startDate != undefined) ||
			(this.dripFlowDetailsForm.value.endDate && this.dripFlowDetailsForm.value.endDate.startDate != null)
		) {
			payload.campaignDetails.endDate = this.dripFlowDetailsForm.value.endDate.startDate.format('YYYY-MM-DD');
		}

		if (
			(this.dripFlowDetailsForm.value.startDate && this.dripFlowDetailsForm.value.startDate.startDate != undefined) ||
			(this.dripFlowDetailsForm.value.startDate && this.dripFlowDetailsForm.value.startDate.startDate != null)
		) {
			payload.campaignDetails.startDate = this.dripFlowDetailsForm.value.startDate.startDate.format('YYYY-MM-DD');
		}

		if (payload.campaignDetails && payload.campaignDetails.startDate && payload.campaignDetails.startTimeId) {
			payload.campaignDetails.startDate = this.getDateByDateAndTimePickerId(
				payload.campaignDetails.startDate,
				payload.campaignDetails.startTimeId
			);
		}

		if (payload.campaignDetails && payload.campaignDetails.endDate && payload.campaignDetails.endTimeId) {
			payload.campaignDetails.endDate = this.getDateByDateAndTimePickerId(
				payload.campaignDetails.endDate,
				payload.campaignDetails.endTimeId
			);
		}

		if (
			(payload.campaignDetails && payload.campaignDetails.startDate && payload.campaignDetails.startTimeId) ||
			(payload.campaignDetails && payload.campaignDetails.endDate && payload.campaignDetails.endTimeId)
		) {
			if (payload.campaignDetails && payload.campaignDetails.startDate && payload.campaignDetails.startTimeId) {
				if (new Date() > new Date(payload.campaignDetails.startDate)) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectDateAfterCurrentDate'),
						this.appService.getTranslation('Utils.error')
					);
					this.selectedStartOnDate = {
						startDate: moment().subtract(0, 'days').startOf('day'),
						endDate: moment().subtract(0, 'days').startOf('day'),
					};
					this.selectedendOnDate = {
						startDate: moment().add(1, 'days').startOf('day'),
						endDate: moment().add(1, 'days').startOf('day'),
					};
					this.dripFlowDetailsForm.controls['startTimeId'].setValue(null);
					this.dripFlowDetailsForm.controls['endTimeId'].setValue(null);
					return;
				}
			}

			if (payload.campaignDetails && payload.campaignDetails.endDate && payload.campaignDetails.endTimeId) {
				if (new Date() > new Date(payload.campaignDetails.endDate)) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectDateAfterCurrentDate'),
						this.appService.getTranslation('Utils.error')
					);
					this.selectedStartOnDate = {
						startDate: moment().subtract(0, 'days').startOf('day'),
						endDate: moment().subtract(0, 'days').startOf('day'),
					};
					this.selectedendOnDate = {
						startDate: moment().add(1, 'days').startOf('day'),
						endDate: moment().add(1, 'days').startOf('day'),
					};
					this.dripFlowDetailsForm.controls['startTimeId'].setValue(null);
					this.dripFlowDetailsForm.controls['endTimeId'].setValue(null);
					return;
				}
			}

			if (payload.campaignDetails.startDate > payload.campaignDetails.endDate) {
				this.toastr.error(
					this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.endDateafterstartDate'),
					this.appService.getTranslation('Utils.error')
				);
				this.selectedStartOnDate = {
					startDate: moment().subtract(0, 'days').startOf('day'),
					endDate: moment().subtract(0, 'days').startOf('day'),
				};
				this.selectedendOnDate = {
					startDate: moment().add(1, 'days').startOf('day'),
					endDate: moment().add(1, 'days').startOf('day'),
				};
				this.dripFlowDetailsForm.controls['startTimeId'].setValue(null);
				this.dripFlowDetailsForm.controls['endTimeId'].setValue(null);
				return;
			}
		}
	}

	DateChangeForDripTriggerDate(value) {
		let payload = {
			dripDetails: this.dripFlowDripForm.value,
		};

		if (
			(this.dripFlowDripForm.value.dripTriggerDate &&
				this.dripFlowDripForm.value.dripTriggerDate.startDate != undefined) ||
			(this.dripFlowDripForm.value.dripTriggerDate && this.dripFlowDripForm.value.dripTriggerDate.startDate != null)
		) {
			payload.dripDetails.dripTriggerDate = this.dripFlowDripForm.value.dripTriggerDate.startDate.format('YYYY-MM-DD');
		}

		if (payload.dripDetails && payload.dripDetails.dripTriggerDate && payload.dripDetails.dripTriggerTimeId) {
			payload.dripDetails.dripTriggerDate = this.getDateByDateAndTimePickerId(
				this.dripFlowDripForm.value.dripTriggerDate,
				this.dripFlowDripForm.value.dripTriggerTimeId
			);

			if (this.dripFlowDetailsForm.value.startRule == 'Start on date') {
				if (
					new Date(payload.dripDetails.dripTriggerDate) < new Date(this.dripFlowDetailsForm.value.startDate) ||
					new Date(payload.dripDetails.dripTriggerDate) > new Date(this.dripFlowDetailsForm.value.endDate)
				) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectDateBetweenStartAndEndDate'),
						this.appService.getTranslation('Utils.error')
					);
					this.selecteddripTriggerDate = {
						startDate: moment().subtract(0, 'days').startOf('day'),
						endDate: moment().subtract(0, 'days').startOf('day'),
					};
					this.dripFlowDripForm.controls['dripTriggerTimeId'].setValue(null);
					return;
				}
			}

			if (
				this.dripFlowDetailsForm.value.startRule == 'Start when learner is added to group' ||
				this.dripFlowDetailsForm.value.startRule == 'Start when tag is added to learner'
			) {
				if (new Date(payload.dripDetails.dripTriggerDate) > new Date(this.dripFlowDetailsForm.value.endDate)) {
					this.toastr.error(
						this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectDatebeforeEndDate'),
						this.appService.getTranslation('Utils.error')
					);
					this.selecteddripTriggerDate = {
						startDate: moment().subtract(0, 'days').startOf('day'),
						endDate: moment().subtract(0, 'days').startOf('day'),
					};
					this.dripFlowDripForm.controls['dripTriggerTimeId'].setValue(null);
					return;
				}
				// if(new Date() < new Date(payload.dripDetails.dripTriggerDate)){
				//     this.toastr.error(this.appService.getTranslation('Pages.DripFlow.AddEdit.Toaster.selectDateAfterCurrentDate'), this.appService.getTranslation('Utils.error'));
				//     this.selecteddripTriggerDate = { startDate: moment().subtract(0, 'days').startOf('day'), endDate: moment().subtract(0, 'days').startOf('day') };
				//     this.dripFlowDripForm.controls['dripTriggerTimeId'].setValue(null);
				//     return;
				// }
			}
		}

		this.istriggerDateSelected = false;
	}

	editButtonDisableByUSeingStatus(status) {
		let disableStatus = ['Removed', 'Delivered', 'Delivering', 'Performing', 'Performed', 'Deleted'];
		if (disableStatus.indexOf(status) > -1) {
			return true;
		} else {
			return false;
		}
	}

	editButtonDisableByUSeingStatusForEdit(status) {
		let disableStatus = ['Removed', 'Deleted', 'Scheduled', 'PFA'];
		if (disableStatus.indexOf(status) > -1) {
			return true;
		} else {
			return false;
		}
	}

	editButtonDisableByUSeingStatusForView(status) {
		let disableStatus = ['Delivered', 'Delivering', 'Performing', 'Performed'];
		if (disableStatus.indexOf(status) > -1) {
			return true;
		} else {
			return false;
		}
	}

	removeButtonDisableByUsingStatus(status) {
		let disableStatus = ['Removed', 'Delivered', 'Delivering', 'Performing', 'Performed', 'Deleted'];
		if (disableStatus.indexOf(status) > -1) {
			return true;
		} else {
			return false;
		}
	}

	selectClient() {
		if (this.ownerClient.id && this.ownerClient.UserId && this.ownerClient.RoleId) {
			this.selectedClientId = this.ownerClient.id;
			this.userId = this.ownerClient.UserId;
			this.userRoleId = this.ownerClient.RoleId;
			this.getCustomDateFields();
			$('#selecteClientList').modal('hide');
			this.getLearnerGroupByUserId(this.userId, this.selectedClientId, this.userRoleId);
		}
	}
	selctedClient(event) {
		this.userListForOwnList = [];
		if (event) {
			this.ownerClient.name = event.name;
			this.ownerClient.UserId = null;
			this.ownerClient.RoleId = null;
			this.ownerClient.fullName = null;
		}
	}

	selectRole(event) {
		if (event && this.ownerClient.id) {
			this.ownerClient.RoleId = event.RoleId;
			this.dripFlowService.getSelctedClientAdminUserList(this.ownerClient.id, event.RoleId).subscribe((res: any) => {
				if (res.success) {
					this.userListForOwnList = [];
					this.userListForOwnList = res.data;
				}
			});
		}
	}

	selctedUser(event) {
		if (event) {
			this.ownerClient.UserId = event.id;
			this.ownerClient.fullName = event.fullName;
		}
	}
	cancelClientlistPopUp() {
		this.router.navigate(['/drip-flows']);
	}

	cancel() {
		if (this.pageDetails != null || this.pageDetails != undefined) {
			this.savePagination();
			setTimeout(() => {
				this.router.navigate(['/drip-flows']);
			}, 100);
		} else {
			this.router.navigate(['/drip-flows']);
		}
	}

	savePagination() {
		let payload = {
			pageNo: this.pageDetails.pageNo,
			isPageChange: true,
		};
		localStorage.setItem('dripflowPageNo', JSON.stringify(payload));
	}

	selectQuestion(question) {
		//Need to Check Question Type
		//If Question Type os MCQ then Show Options
		//If Question Type is Rating Scale then Show Less than, Greater than and Equal to
		this.selctedRatingScaleQuestion = false;
		this.showPoolOption = false;
		this.pool_activity_option_list = [];
		if (question.questionType === 'MCQ' || question.questionType === 'Drop Down') {
			//Show Options
			this.showPoolOption = true;
			this.pool_activity_option_list = [];
			this.selctedRatingScaleQuestion = false;
			for (let option of question.DripOptions) {
				this.pool_activity_option_list.push({ name: option.text });
			}
		} else if (question.questionType === 'Rating scale') {
			//Show Less than, Greater than and Equal to
			this.selctedRatingScaleQuestion = true;
			if (question?.DripOptions?.length > 0) {
				this.scoreLimit = question.DripOptions.length;
			} else {
				this.scoreLimit = 0;
			}
		}
	}

	selecteDripTriggerRule(event) {
		if (event?.label === 'Send based on contact milestone') {
			this.dripFlowDripForm.controls['dripTriggerDate'].setValue(new Date());
		}
		// console.log('--Event--', event);
	}

	loadSuccessMetricsDripList() {
		this.successMetricsDripList = [];
		for (let drip of this.selectedDripForDripFlow) {
			if (drip.dripFlowType === 'Send a Drip') {
				this.successMetricsDripList.push({
					dripId: drip.dripId,
					dripName: drip.dripName,
					DripCampIndex: drip.index,
					tempType: drip.tempType,
					dripType: drip.dripType,
					status: drip.status,
				});
			}
		}
		return;
	}

	async addSuccessMetrics() {
		if (this.successMetricsList.length < 6) {
			await this.loadSuccessMetricsDripList();
			this.editSuccessMetricsIndex = null;
			this.successMetricsForm.reset();
			$('#addEditSuccessMetricsModel').modal('show');
		}
	}

	selectMetricsDrip(event) {
		// console.log('-----eventeventeventevent', event);
		this.isPresentExternalLink = false;
		this.isPresentQuickReplay = false;
		if (event && event.length === 1) {
			//need to check the External Link and Quick Reply is Present Or Not
			this.successMetricsForm.controls['PostId'].setValue(event[0].dripId);
			this.successMetricsForm.controls['tempType'].setValue(event[0].tempType);
			this.successMetricsForm.controls['dripType'].setValue(event[0].dripType);
			this.successMetricsForm.controls['status'].setValue(event[0].status);

			this.postService.getDripByDripId(event[0].dripId).subscribe((res: any) => {
				if (res.success) {
					//Check Drip Type and Then Check Quick Replay is present or not
					if (res.data.drip_type === 'Only WhatsApp') {
						if (res.data.Drip_whatsapp_natives.length > 0) {
							//Check For Quick Replay
							for (let i = 1; i <= 10; i++) {
								if (res.data.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
									this.isPresentQuickReplay = true;
									break;
								}
							}
							//Check External Link
							if (
								res.data.Drip_whatsapp_natives[0].trackableLink ||
								res.data.Drip_whatsapp_natives[0].trackableLink2 ||
								res.data.Drip_whatsapp_natives[0].zoomTrackable ||
								res.data.Drip_whatsapp_natives[0].zoomTrackable2
							) {
								this.isPresentExternalLink = true;
							}
						}
					} else if (res.data.drip_type === 'Only Teams') {
						//Check External Link Into Only Teams
						if (
							res.data.DripOnlyTeams[0].trackableLink1 ||
							res.data.DripOnlyTeams[0].trackableLink2 ||
							res.data.DripOnlyTeams[0].trackableLink3
						) {
							this.isPresentExternalLink = true;
						}
					} else if (res.data.externalLinkFlag) {
						this.isPresentExternalLink = true;
					} else if (res.data.drip_type === 'Only Email') {
						this.isSendGridEmail = res.data.Drip_only_emails[0].isSendGridTemplate;
					}
				}
			});
		} else if (event && event.length === 0) {
			this.successMetricsForm.controls['PostId'].setValue(null);
			this.successMetricsForm.controls['tempType'].setValue(null);
			this.successMetricsForm.controls['dripType'].setValue(null);
			this.successMetricsForm.controls['status'].setValue(null);
		} else {
			this.successMetricsForm.controls['PostId'].setValue(null);
			this.successMetricsForm.controls['tempType'].setValue('Select All');
			this.successMetricsForm.controls['dripType'].setValue(null);
			this.successMetricsForm.controls['status'].setValue(null);
		}
		// console.log("---------this.successMetricsForm.controls['status']------", this.successMetricsForm.value);
	}

	cancelSuccessMetricsPopup() {
		$('#addEditSuccessMetricsModel').modal('hide');
	}

	SaveSuccessMetrics(index?) {
		// console.log('------index--------------');
		if (this.successMetricsForm.invalid) {
			this.markAsTouched(this.successMetricsForm);
			// console.log('------index----22----------', this.successMetricsForm.value);

			return;
		} else {
			//Need to Validate First and then pass forword
			// Quick Reply Selected - Only WhatsApp  quickReply
			// Survey - Option Selected
			if (
				(this.successMetricsForm.controls['tempType'].value === null ||
					this.successMetricsForm.controls['tempType'].value === '') &&
				['Only WhatsApp', 'Only Teams', 'Only Email'].indexOf(this.successMetricsForm.controls['dripType'].value) == -1
			) {
				this.successMetricsForm.controls['tempType'].setErrors({ required: true });
			}
			if (this.successMetricsForm.controls['tempType'].value === 'Select All') {
				//
			} else if (['Quiz', 'Quiz (Randomised)'].indexOf(this.successMetricsForm.controls['tempType'].value) > -1) {
				if (this.successMetricsForm.controls['metrics'].value === 'Score is greater than/less than/equal to') {
					if (
						this.successMetricsForm.controls['score'].value < 0 ||
						this.successMetricsForm.controls['score'].value == null ||
						this.successMetricsForm.controls['score'].value == ''
					) {
						this.successMetricsForm.controls['score'].setErrors({ required: true });
					} else if (this.successMetricsForm.controls['score'].value > this.maxScoreForQuiz) {
						this.toastr.error('Score should be less than or equal to ' + this.maxScoreForQuiz);
						return;
					}

					if (this.successMetricsForm.controls['activityScoreType'].value == null) {
						this.successMetricsForm.controls['activityScoreType'].setErrors({ required: true });
					}
				}
			} else if (this.successMetricsForm.controls['tempType'].value === 'Poll') {
				if (this.successMetricsForm.controls['metrics'].value === 'Option Selected') {
					if (this.successMetricsForm.controls['DripOptionId'].value == null) {
						this.successMetricsForm.controls['DripOptionId'].setErrors({ required: true });
					}
				}
			} else if (this.successMetricsForm.controls['tempType'].value === 'Survey') {
				if (this.successMetricsForm.controls['metrics'].value === 'Option Selected') {
					if (this.successMetricsForm.controls['DripQuestionId'].value == null) {
						this.successMetricsForm.controls['DripQuestionId'].setErrors({ required: true });
					}
					if (this.successMetricsForm.controls['DripOptionId'].value == null) {
						this.successMetricsForm.controls['DripOptionId'].setErrors({ required: true });
					}
				} else if (this.successMetricsForm.controls['metrics'].value === 'Rating is more than/less than/equal to') {
					if (this.successMetricsForm.controls['activityScoreType'].value == null) {
						this.successMetricsForm.controls['activityScoreType'].setErrors({ required: true });
					}

					if (this.successMetricsForm.controls['score'].value == null) {
						this.successMetricsForm.controls['score'].setErrors({ required: true });
					} else if (this.successMetricsForm.controls['score'].value > this.maxRatingForSurvey) {
						this.toastr.error('Rating should be less than or equal to ' + this.maxRatingForSurvey);
						return;
					}
				}
			} else if (this.successMetricsForm.controls['tempType'].value === 'Video') {
				if (this.successMetricsForm.controls['metrics'].value === 'Watched more than/less than') {
					if (this.successMetricsForm.controls['activityScoreType'].value == null) {
						this.successMetricsForm.controls['activityScoreType'].setErrors({ required: true });
					}
					if (
						this.successMetricsForm.controls['score'].value == null ||
						this.successMetricsForm.controls['score'].value < 0
					) {
						this.successMetricsForm.controls['score'].setErrors({ required: true });
					}
				}
			} else if (this.successMetricsForm.controls['tempType'].value === 'Offline Task') {
				if (this.successMetricsForm.controls['metrics'].value === 'Grade is') {
					if (
						this.successMetricsForm.controls['offlineTaskText'].value == null ||
						this.successMetricsForm.controls['offlineTaskText'].value == ''
					) {
						this.successMetricsForm.controls['offlineTaskText'].setErrors({ required: true });
					}
				}
			}

			if (this.successMetricsForm.invalid) {
				return;
			}

			if (index != null && index != undefined) {
				this.successMetricsList[index] = this.successMetricsForm.value;
			} else {
				this.successMetricsList.push(this.successMetricsForm.value);
			}
			this.editSuccessMetricsIndex = null;
			$('#addEditSuccessMetricsModel').modal('hide');
		}
	}

	async editSuccessMetrics(index) {
		this.editSuccessMetricsIndex = index;
		this.loadSuccessMetricsDripList();
		this.successMetricsForm.reset();
		this.successMetricsForm.patchValue(this.successMetricsList[index]);
		this.checkMetricsCharacterLimit(this.successMetricsList[index].label);
		this.successMetricsForm.controls['PostId'].value;
		if (this.successMetricsForm.controls['tempType'].value !== 'Select All') {
			await this.getDripDateForSuccessMetrics(
				this.successMetricsForm.controls['tempType'].value,
				this.successMetricsForm.controls['PostId'].value,
				this.successMetricsForm.controls['dripType'].value
			);
		}

		//Set Question List and Option List

		$('#addEditSuccessMetricsModel').modal('show');
	}

	deleteMetric(index) {
		if (['Scheduled', 'PFA'].indexOf(this.successMetricsList[index].status) > -1) {
			this.successMetricsList.splice(index, 1);
		}
	}

	async selecteMetrics(event) {
		// console.log('--event--', event.name);
		let tempType = this.successMetricsForm.controls['tempType'].value;
		let dripType = this.successMetricsForm.controls['dripType'].value;
		let PostId = this.successMetricsForm.controls['PostId'].value;
		//Need to get Drip Data
		let conditionList = [
			'Score is greater than/less than/equal to',
			'Option Selected',
			'Rating is more than/less than/equal to',
			'Quick Reply Selected',
		];

		if (conditionList.indexOf(event.name) > -1) {
			await this.getDripDateForSuccessMetrics(tempType, PostId, dripType);
		}
	}

	getDripDateForSuccessMetrics(tempType, PostId, dripType) {
		this.postService.getDripByDripId(PostId).subscribe((res: any) => {
			if (res?.success) {
				if (tempType === 'Quiz' || tempType === 'Quiz (Randomised)') {
					this.maxScoreForQuiz = res.data.DripQuestions.length * 2;
				} else if (tempType === 'Survey') {
					this.dropDownRatingQuestionList = [];
					if (res.data.DripQuestions.length > 0) {
						for (let question of res.data.DripQuestions) {
							if (
								question.questionType === 'Rating scale' &&
								this.successMetricsForm.controls['metrics'].value === 'Rating is more than/less than/equal to'
							) {
								this.dropDownRatingQuestionList.push(question);
							} else if (
								['Drop Down', 'MCQ'].indexOf(question.questionType) > -1 &&
								this.successMetricsForm.controls['metrics'].value === 'Option Selected'
							) {
								this.dropDownRatingQuestionList.push(question);
								if (
									this.successMetricsForm.controls['DripQuestionId'].value != null &&
									this.successMetricsForm.controls['DripQuestionId'].value === question.id
								) {
									this.dropDownRatingQuestionsOptionList = [];
									this.dropDownRatingQuestionsOptionList = question.DripOptions;
								}
							}
						}
					}
				} else if (tempType === 'Poll') {
					this.pollOptionListForMetrics = [];
					for (let option of res.data.DripQuestions[0].DripOptions) {
						this.pollOptionListForMetrics.push(option);
					}
				} else if (dripType === 'Only WhatsApp') {
					this.onlyWhatsAppQuickReplayList = [];
					for (let i = 1; i <= 10; i++) {
						if (res?.data?.Drip_whatsapp_natives[0]['quickReply' + i] != null) {
							this.onlyWhatsAppQuickReplayList.push({
								label: res.data.Drip_whatsapp_natives[0]['quickReply' + i],
								PostId: res.data.id,
							});
						}
					}
					// console.log('-----this.onlyWhatsAppQuickReplayList------', this.onlyWhatsAppQuickReplayList);
				} else if (dripType === 'Only Email') {
					this.isSendGridEmail = res.data.Drip_only_emails[0].isSendGridTemplate;
				}
			}
		});
	}

	selectMetricsQuestion(event) {
		console.log('--event--', event);
		this.dropDownRatingQuestionsOptionList = [];
		if (event && event.DripOptions && event.DripOptions.length > 0) {
			if (this.successMetricsForm.controls['metrics'].value === 'Rating is more than/less than/equal to') {
				this.maxRatingForSurvey = event.DripOptions.length;
			}
			this.dropDownRatingQuestionsOptionList = event.DripOptions;
			this.successMetricsForm.controls['question'].setValue(event.question);
		} else {
			this.successMetricsForm.controls['question'].setValue(null);
		}
	}

	selectOption(event) {
		if (event) {
			this.successMetricsForm.controls['option'].setValue(event.text);
		} else {
			this.successMetricsForm.controls['option'].setValue(null);
		}
	}

	selectFlowType() {
		this.dripFlowDetailsForm.controls['startRule'].setValue(null);
		this.dripFlowDetailsForm.controls['startRule'].setErrors(null);
	}

	checkReserveTags(tagType) {
		//1 ==>> Start Rule Tags
		//2 ==>> In System Activity
		//3 ==>> In Action (Add Tag , Delete Tag)
		if (tagType === 1) {
			if ([null, '', undefined].indexOf(this.f.tags.value) == -1) {
				this.dripFlowService
					.checkTagsIsUseOrNotInConversationalFlow(
						{ tags: this.f.tags.value, CampaingId: this.dripFlowDetailsForm.controls['id'].value },
						this.selectedClientId
					)
					.subscribe((res: any) => {
						if (res.success) {
							if (!res.canUse) {
								this.dripFlowDetailsForm.controls['tags'].setValue(res.notUseTags.toString());
								this.toastr.error(res.message);
								return;
							}
						}
					});
			}
		} else if (tagType === 2) {
			if ([null, '', undefined].indexOf(this.f2.tagsForSystemAction.value) == -1) {
				this.dripFlowService
					.checkTagsIsUseOrNotInConversationalFlow(
						{ tags: this.f2.tagsForSystemAction.value, CampaingId: this.dripFlowDetailsForm.controls['id'].value },
						this.selectedClientId
					)
					.subscribe((res: any) => {
						if (res.success) {
							if (!res.canUse) {
								this.dripFlowDripForm.controls['tagsForSystemAction'].setValue(res.notUseTags.toString());
								this.toastr.error(res.message);
								return;
							}
						}
					});
			}
		} else if (tagType === 3) {
			if ([null, '', undefined].indexOf(this.f2.tagsForAction.value) == -1) {
				this.dripFlowService
					.checkTagsIsUseOrNotInConversationalFlow(
						{ tags: this.f2.tagsForAction.value, CampaingId: this.dripFlowDetailsForm.controls['id'].value },
						this.selectedClientId
					)
					.subscribe((res: any) => {
						if (res.success) {
							if (!res.canUse) {
								this.dripFlowDripForm.controls['tagsForAction'].setValue(res.notUseTags.toString());
								this.toastr.error(res.message);
								return;
							}
						}
					});
			}
		}
	}

	checkMetricsCharacterLimit(val) {
		var len = val.length;
		this.characterRemainsForMetrics = this.maxMetricsLength - len;
	}
}
