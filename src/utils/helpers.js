import { paths } from '@/routes/paths';
import { UserRole } from './constants';

export const LoggedInUserPath = (currentUser) =>
  currentUser?.role === UserRole.admin
    ? paths.adminDashboard
    : currentUser?.role === UserRole.seller
      ? paths.sellerDashboard
      : currentUser?.role === UserRole.customer
        ? paths.customerDashboard
        : paths.index;

export const shortenString = (str, maxLength = 12) => {
  if (str.length <= maxLength) {
    return str;
  }
  const start = str.slice(0, Math.floor(maxLength / 2));
  const end = str.slice(-Math.floor(maxLength / 2));
  return `${start}...${end}`;
};

export const removeHtmlTags = (html) =>{
   if(html !== undefined){
     return html.replace(/<\/?p>/g, '').replace(/<\/?br>/g, '\n');
   }
}