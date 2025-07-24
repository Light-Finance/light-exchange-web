interface IMarketItem{
    title: string;
    imgs: any[];
    id: string;
    descriptions: string[];
    price: number;
}
export interface IEmail{
    email: string;
}
export interface IModal {
    name: string;
    modalChildren: JSX.Element;
    size?: string;
  }
export interface IContactUs{
    email: string;
    description: string;
    subject: string;
}
export interface IAcademy{
    illustration: any;
    title: string;
    status: boolean;
    youtubeIllustration?: string;
    sommaire?: string[];
    marketingPrice?: number;
    price?: number;
    freeDownloadLink?: string;
}
export interface IAppsItem{
    title: string;
    descriptions: any;
}
export interface IMiningItem{
    illustration: any;
    title: string;
}
export interface IUser{
    id?: string;
    name?: string;
    email?:string;
    phone?:string;
    password?: string;
    confirmPassword?:string;
    referalCode?: string;
}