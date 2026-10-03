import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { LoginComponent } from './Components/login/login.component';
import { CompanyCreateComponent } from './Components/Masters/company-create/company-create.component';
import { AddProductsComponent } from './Components/add-products/add-products.component';
import { EnquiryComponent } from './Components/enquiry/enquiry.component';
import { StateMasterComponent } from './Components/Masters/state-master/state-master.component';
import { DistrictMasterComponent } from './Components/Masters/district-master/district-master.component';
import { ProductListComponent } from './Components/product-list/product-list.component';
import { ProductDetailsComponent } from './Components/product-details/product-details.component';
import { UnitMasterComponent } from './Components/Masters/unit-master/unit-master.component';
import { BrandMasterComponent } from './Components/Masters/brand-master/brand-master.component';
import { CategoryCreateComponent } from './Components/Masters/category-create/category-create.component';
import { ProfileComponent } from './Components/profile/profile.component';
import { CompanyListComponent } from './Components/Masters/company-list/company-list.component';
import { SubCategoryCreateComponent } from './Components/Masters/sub-category-create/sub-category-create.component';
import { AddToCartComponent } from './Components/add-to-cart/add-to-cart.component';
import { RequirementComponent } from './Components/requirement/requirement.component';
import { SellerRegistrationComponent } from './Components/seller-registration/seller-registration.component';
import { BranchMasterComponent } from './Components/Masters/branch-master/branch-master.component';
import { ProductEnquiryComponent } from './Components/product-enquiry/product-enquiry.component';
import { HelpBuyingComponent } from './Components/help/help-buying/help-buying.component';
import { HelpSellingComponent } from './Components/help/help-selling/help-selling.component';
import { AboutComponent } from './Components/about/about.component';
import { ContactUsComponent } from './Components/contact-us/contact-us.component';
import { FAQComponent } from './Components/faq/faq.component';
import { TestimonialsComponent } from './Components/testimonials/testimonials.component';
import { AgreementComponent } from './Components/agreement/agreement.component';
import { CheckoutComponent } from './Components/checkout/checkout.component';
import { CreateOfferComponent } from './Components/Masters/create-offer/create-offer.component';
import { CreateOfferNameComponent } from './Components/Masters/create-offer-name/create-offer-name.component';
import { ReturnPolicyComponent } from './Components/return-policy/return-policy.component';
import { CreateMarketingPartnerComponent } from './Components/Masters/create-marketing-partner/create-marketing-partner.component';
import { MyOrderComponent } from './Components/my-order/my-order.component';
import { MarketingPartnerEnquiryComponent } from './Components/Masters/marketing-partner-enquiry/marketing-partner-enquiry.component';
import { MyProductEnquiriesComponent } from './Components/my-product-enquiries/my-product-enquiries.component';
import { InfoPageComponent } from './Components/info-page/info-page.component';

import { provideRouter, withRouterConfig } from '@angular/router';
import { TermsAndConditionsComponent } from './Components/terms-n-conditions/terms-n-conditions.component';
import { FranchiseApplyComponent } from './Components/franchise-apply/franchise-apply.component';
import { InfoCompanyComponent } from './Components/info-company/info-company.component';
import { InfoPartnerComponent } from './Components/info-partner/info-partner.component';
import { PropertyCreateComponent } from './Components/Masters/property-create/property-create.component';
import { PropertyListComponent } from './Components/property-list/property-list.component';
import { OrderDetailComponent } from './Components/order-detail/order-detail.component';
import { LoanEnquiryComponent } from './Components/Masters/loan-enquiry/loan-enquiry.component';
import { PropertyDetailComponent } from './Components/property-detail/property-detail.component';
import { PropertyEnquiryComponent } from './Components/property-enquiry/property-enquiry.component';
import { PlacesNearbyComponent } from './Components/places-nearby/places-nearby.component';
import { authGuard } from './auth.guard';
import { OlxProductCreateComponent } from './Components/Masters/olx-product-create/olx-product-create.component';
import { OlxProductListComponent } from './Components/olx-product-list/olx-product-list.component';
import { OlxProductDetailComponent } from './Components/olx-product-detail/olx-product-detail.component';
import { OlxProductEnquiryComponent } from './Components/olx-product-enquiry/olx-product-enquiry.component';


export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        title: 'home',
        component: HomeComponent,
    },
    {
        path: 'login',
        title: 'login',
        component: LoginComponent,
        canActivate: [authGuard]
    },
    {
        path: 'company_create',
        title: 'company_create',
        component: CompanyCreateComponent,
    },
    {
        path: 'add_products',
        title: 'add_products',
        component: AddProductsComponent,
    },
    {
        path: 'enquiry',
        title: 'enquiry',
        component: EnquiryComponent,
    },
    {
        path: 'State_Master',
        title: 'State_Master',
        component: StateMasterComponent,
    },
    {
        path: 'District_Master',
        title: 'District_Master',
        component: DistrictMasterComponent,
    },
    {
        path: 'Unit_Master',
        title: 'Unit_Master',
        component: UnitMasterComponent,
    },
    {
        path: 'Brand_Master',
        title: 'Brand_Master',
        component: BrandMasterComponent,
    },
    {
        path: 'Category_Master',
        title: 'Category_Master',
        component: CategoryCreateComponent,
    },
    {
        path: 'Sub-Category_Master',
        title: 'Sub-Category_Master',
        component: SubCategoryCreateComponent,
    },

    {
        path: 'product_list',
        title: 'product_list',
        component: ProductListComponent,
    },
    {
        path: 'product_details',
        title: 'product_details',
        component: ProductDetailsComponent,
    },
    {
        path: 'product-details/:slug',
        component: ProductDetailsComponent
    },
    {
        path: 'profile',
        title: 'profile',
        component: ProfileComponent,
    },
    {
        path: 'company_list',
        title: 'company_list',
        component: CompanyListComponent,
    },
    {
        path: 'company/create/:id',
        component: CompanyCreateComponent
    },
    {
        path: 'add_to_cart',
        component: AddToCartComponent
    },
    {
        path: 'requirement',
        component: RequirementComponent
    },
    {
        path: 'seller-registration',
        title: 'Seller Registration',
        component: SellerRegistrationComponent
    },
    {
        path: 'Branch_Master',
        title: 'Branch_Master',
        component: BranchMasterComponent
    },
    {
        path: 'product-enquiry',
        title: 'Product Enquiry',
        component: ProductEnquiryComponent
    },
    {
        path: 'help_buying',
        title: 'help_buying',
        component: HelpBuyingComponent
    },
    {
        path: 'help-selling',
        title: 'help-selling',
        component: HelpSellingComponent
    },
    {
        path: 'about',
        title: 'About QNX Mart',
        component: AboutComponent
    },
    {
        path: 'contact-us',
        title: 'Contact Us',
        component: ContactUsComponent
    },
    {
        path: 'faq',
        title: 'FAQ',
        component: FAQComponent
    },
    {
        path: 'testimonials',
        title: 'Testimonials',
        component: TestimonialsComponent
    },
    {
        path: 'agreement',
        title: 'agreement',
        component: AgreementComponent
    },
    {
        path: 'checkout',
        title: 'checkout',
        component: CheckoutComponent
    },
    {
        path: 'create-offer',
        title: 'create-offer',
        component: CreateOfferComponent
    },
    {
        path: 'create-offer-name',
        title: 'create-offer-name',
        component: CreateOfferNameComponent

    },

    {
        path: 'return-policy',
        title: 'Returns & Refunds | QNX Mart',
        component: ReturnPolicyComponent
    },
    {
        path: 'marketing-partner',
        title: 'marketing-partner',
        component: CreateMarketingPartnerComponent
    },
    {
        path: 'my-orders',
        title: 'my-orders',
        component: MyOrderComponent
    },
    {
        path: 'my-orders/detail',
        title: 'Order Detail',
        component: OrderDetailComponent
    },
    {
        path: 'marketing-partner-enquiry',
        title: 'marketing-partner-enquiry',
        component: MarketingPartnerEnquiryComponent
    },
    {
        path: 'loan-enquiry',
        title: 'loan-enquiry',
        component: LoanEnquiryComponent
    },
    {
        path: 'my-products-enquiry',
        title: 'my-products-enquiry',
        component: MyProductEnquiriesComponent
    },
    {
        path: 'franchise-apply',
        title: 'Franchise Application',
        component: FranchiseApplyComponent
    },
    {
        path: 'property-create',
        title: 'Add Property',
        component: PropertyCreateComponent,
    },
    {
        path: 'property-list',
        title: 'Properties',
        component: PropertyListComponent
    },
    {
        path: 'info-page',
        title: 'QNX Mart | Ecosystem',
        component: InfoPageComponent,
        data: {
            hideLayout: true,
            disableIdleTimeout: true
        }
    },
    {
        path: 'company_info',
        title: 'QNX Mart | Company Ecosystem',
        component: InfoCompanyComponent,
        data: {
            hideLayout: true,
            disableIdleTimeout: true
        }
    },
    {
        path: 'partner_info',
        title: 'QNX Mart | Partner Ecosystem',
        component: InfoPartnerComponent,
        data: {
            hideLayout: true,
            disableIdleTimeout: true
        }
    },
    {
        path: 'terms-and-conditions',
        title: 'Terms & Conditions | QNX Mart',
        component: TermsAndConditionsComponent
    },

    {
        path: 'property-detail/:slug',
        title: 'Property Detail',
        component: PropertyDetailComponent
    },

    {
        path: 'property-enquiry',
        title: 'Property Enquiry',
        component: PropertyEnquiryComponent
    },
    {
        path: 'places-nearby',
        title: 'Places Nearby',
        component: PlacesNearbyComponent
    },

    {
        path: 'remart-product-create',
        title: 'Add OLX Product',
        component: OlxProductCreateComponent,
    },

    {
        path: 'remart-product-list',
        title: 'Product List',
        component: OlxProductListComponent
    },
    {
        path: 'remart-product-detail',
        title: 'Product Detail',
        component: OlxProductDetailComponent
    },
    {
        path: 'remart-product-enquiry',
        title: 'Product Enquiry',
        component: OlxProductEnquiryComponent
    },


];


// ─── appConfig AFTER routes ───
export const appConfig = {
    providers: [
        provideRouter(routes)   // smooth scroll handled in the component
    ]
};
