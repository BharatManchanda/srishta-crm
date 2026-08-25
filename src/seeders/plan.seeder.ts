import 'dotenv/config';

import { PricingCategory, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ACCOUNT_MODULE_ID, ATTACHMENT_MODULE_ID, CALL_MODULE_ID, CONTACT_MODULE_ID, DASHBOARD_MODULE_ID, DEAL_MODULE_ID, EMAIL_MODULE_ID, FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID, GOOGLE_MODULE_ID, IMPORT_MODULE_ID, LEAD_MODULE_ID, LINKEDIN_MODULE_ID, MEETING_MODULE_ID, NOTE_MODULE_ID, PAYMENT_MODULE_ID, ROLE_CONFIG_MODULE_ID, ROLE_MODULE_ID, SETTINGS_MODULE_ID, TASK_MODULE_ID, USER_MODULE_ID, WHATSAPP_MODULE_ID } from './module.seeder';

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const pricingPlans = [
	{
		name: 'Free',
		slug: 'free',
		description: 'Everything you need to get started with a simple CRM.',
		monthlyPrice: 0,
		yearlyPrice: 0,
		popular: false,
		sortOrder: 1,
		cta: 'Get Started',
		modules: [
			{
				"moduleId": DASHBOARD_MODULE_ID,
				"name": "Dashboard",
				"featureLabel": "Dashboard Management",
				"category": PricingCategory.AUTOMATION_ANALYTICS,
				"enabled": true,
			},
			{
				"moduleId": LEAD_MODULE_ID,
				"name": "Leads",
				"featureLabel": "Lead Management",
				"category": PricingCategory.CRM,
				"enabled": true,
				"limit": 500,
				"displayValue": "500"
			},
			{
				"moduleId": CONTACT_MODULE_ID,
				"name": "Contact",
				"featureLabel": "Contact Management",
				"category": PricingCategory.CRM,
				"enabled": true,
				"limit": 500,
				"displayValue": "500"
			},
			{
				"moduleId": ACCOUNT_MODULE_ID,
				"name": "Account",
				"featureLabel": "Account Management",
				"category": PricingCategory.CRM,
				"enabled": true,
				"limit": 200,
				"displayValue": "200"
			},
			{
				"moduleId": DEAL_MODULE_ID,
				"name": "Deal",
				"featureLabel": "Deal Management",
				"category": PricingCategory.CRM,
				"enabled": true,
				"limit": 10,
				"displayValue": "10"
			},
			{
				"moduleId": TASK_MODULE_ID,
				"name": "Task",
				"featureLabel": "Task Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": CALL_MODULE_ID,
				"name": "Call",
				"featureLabel": "Call Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": MEETING_MODULE_ID,
				"name": "Meeting",
				"featureLabel": "Meeting Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": USER_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ROLE_MODULE_ID,
				"name": "Role",
				"featureLabel": "Role based management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
			{
				"moduleId": IMPORT_MODULE_ID,
				"name": "Import",
				"featureLabel": "Bulk import management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": NOTE_MODULE_ID,
				"name": "Note",
				"featureLabel": "Note management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ATTACHMENT_MODULE_ID,
				"name": "Attachment",
				"featureLabel": "Attachment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
{
				"moduleId": SETTINGS_MODULE_ID,
				"name": "Settings",
				"featureLabel": "Settings management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
			{
				"moduleId": PAYMENT_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.FINANCE,
				"enabled": true,
			},
		]
	},
	{
		name: 'Starter',
		slug: 'starter',
		description: 'Perfect for small teams ready to organize and grow.',
		monthlyPrice: 499,
		yearlyPrice: 399,
		popular: false,
		sortOrder: 2,
		cta: 'Upgrade',
		modules: [
			{
				"moduleId": DASHBOARD_MODULE_ID,
				"name": "Dashboard",
				"featureLabel": "Dashboard Management",
				"category": PricingCategory.AUTOMATION_ANALYTICS,
				"enabled": true,
			},
			{
				"moduleId": LEAD_MODULE_ID,
				"name": "Leads",
				"featureLabel": "Lead Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": CONTACT_MODULE_ID,
				"name": "Contact",
				"featureLabel": "Contact Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ACCOUNT_MODULE_ID,
				"name": "Account",
				"featureLabel": "Account Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": DEAL_MODULE_ID,
				"name": "Deal",
				"featureLabel": "Deal Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": TASK_MODULE_ID,
				"name": "Task",
				"featureLabel": "Task Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": CALL_MODULE_ID,
				"name": "Call",
				"featureLabel": "Call Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": MEETING_MODULE_ID,
				"name": "Meeting",
				"featureLabel": "Meeting Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": USER_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": IMPORT_MODULE_ID,
				"name": "Import",
				"featureLabel": "Bulk import management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": NOTE_MODULE_ID,
				"name": "Note",
				"featureLabel": "Note management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ATTACHMENT_MODULE_ID,
				"name": "Attachment",
				"featureLabel": "Attachment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
{
				"moduleId": SETTINGS_MODULE_ID,
				"name": "Settings",
				"featureLabel": "Settings management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
			{
				"moduleId": ROLE_MODULE_ID,
				"name": "Role",
				"featureLabel": "Role based management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
			{
				"moduleId": PAYMENT_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.FINANCE,
				"enabled": true,
			},
		]
	},
	{
		name: 'Professional',
		slug: 'professional',
		description: 'Powerful automation and integrations for growing teams.',
		monthlyPrice: 999,
		yearlyPrice: 799,
		popular: true,
		sortOrder: 3,
		cta: 'Upgrade',
		modules: [
			{
				"moduleId": DASHBOARD_MODULE_ID,
				"name": "Dashboard",
				"featureLabel": "Dashboard Management",
				"category": PricingCategory.AUTOMATION_ANALYTICS,
				"enabled": true,
			},
			{
				"moduleId": LEAD_MODULE_ID,
				"name": "Leads",
				"featureLabel": "Lead Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": CONTACT_MODULE_ID,
				"name": "Contact",
				"featureLabel": "Contact Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ACCOUNT_MODULE_ID,
				"name": "Account",
				"featureLabel": "Account Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": DEAL_MODULE_ID,
				"name": "Deal",
				"featureLabel": "Deal Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": TASK_MODULE_ID,
				"name": "Task",
				"featureLabel": "Task Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": CALL_MODULE_ID,
				"name": "Call",
				"featureLabel": "Call Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": MEETING_MODULE_ID,
				"name": "Meeting",
				"featureLabel": "Meeting Management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": EMAIL_MODULE_ID,
				"name": "Email",
				"featureLabel": "Email Integration",
				"category": PricingCategory.COMMUNICATION,
				"enabled": true,
			},
			{
				"moduleId": WHATSAPP_MODULE_ID,
				"name": "Whatsapp",
				"featureLabel": "Whatsapp Integration",
				"category": PricingCategory.COMMUNICATION,
				"enabled": true,
			},
			{
				"moduleId": GOOGLE_MODULE_ID,
				"name": "Google",
				"featureLabel": "Google Ads lead sync",
				"category": PricingCategory.MARKETING,
				"enabled": true,
			},
			{
				"moduleId": LINKEDIN_MODULE_ID,
				"name": "Linkedin",
				"featureLabel": "Linkedin Ads lead sync",
				"category": PricingCategory.MARKETING,
				"enabled": true,
			},
			{
				"moduleId": FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID,
				"name": "Facebook & Instagram",
				"featureLabel": "Facebook & Instagram Ads lead sync",
				"category": PricingCategory.MARKETING,
				"enabled": true,
			},
			{
				"moduleId": ROLE_MODULE_ID,
				"name": "Role",
				"featureLabel": "Role based management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
			{
				"moduleId": PAYMENT_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.FINANCE,
				"enabled": true,
			},
			{
				"moduleId": USER_MODULE_ID,
				"name": "Payment",
				"featureLabel": "Payment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": NOTE_MODULE_ID,
				"name": "Note",
				"featureLabel": "Note management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": ATTACHMENT_MODULE_ID,
				"name": "Attachment",
				"featureLabel": "Attachment management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": IMPORT_MODULE_ID,
				"name": "Import",
				"featureLabel": "Bulk import management",
				"category": PricingCategory.CRM,
				"enabled": true,
			},
			{
				"moduleId": SETTINGS_MODULE_ID,
				"name": "Settings",
				"featureLabel": "Settings management",
				"category": PricingCategory.SUPPORT_SECURITY,
				"enabled": true,
			},
		]
	},
];

export default async function seedPlans() {
	for (const pricing of pricingPlans) {
		await prisma.$transaction(async (tx) => {
			const plan = await tx.pricingPlan.upsert({
				where: {
					slug: pricing.slug,
				},

				update: {
					// name: pricing.name,
					// description: pricing.description,
					// monthlyPrice: pricing.monthlyPrice,
					// yearlyPrice: pricing.yearlyPrice,
					// popular: pricing.popular,
					// sortOrder: pricing.sortOrder,
					// cta: pricing.cta,
				},

				create: {
					name: pricing.name,
					slug: pricing.slug,
					description: pricing.description,
					monthlyPrice: pricing.monthlyPrice,
					yearlyPrice: pricing.yearlyPrice,
					popular: pricing.popular,
					sortOrder: pricing.sortOrder,
					cta: pricing.cta,
				},
			});

			// Remove existing modules for this plan
			await tx.planModule.deleteMany({
				where: {
					planId: plan.id,
				},
			});

			// Create modules for this plan
			await tx.planModule.createMany({
				data: pricing.modules.map((module, index) => ({
					planId: plan.id,
					moduleId: module.moduleId,
					enabled: module.enabled,
					limit: module.limit ?? null,
					displayValue: module.displayValue ?? null,
					sortOrder: index + 1,
					featureLabel: module.featureLabel ?? null,
				})),
			});
		});
	}
}
