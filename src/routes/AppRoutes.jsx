import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { paths } from './paths';
import PublicPagesLayout from '@/pages/PublicPages/PublicPagesLayout';

export const AppRoutes = () => (
  <Routes>
    <Route path={paths.index} element={<PublicPagesLayout />}>

    </Route>

    {/* Company Route */}
    <Route path={paths.companyIndex} element={<CompanyLayout />}>

    </Route>
    {/* Auth Pages */}
    {/* <Route path={paths.index} element={<AuthPageLayout />}>
      <Route path={paths.login} element={<Login />} />
      <Route path={paths.register} element={<Register />} />
      <Route path={paths.otp} element={<VerifyOtp />} />
      <Route path={paths.resendOtp} element={<ResendOTP />} />
      <Route path={paths.forgotPassword} element={<ForgotPassword />} />
      <Route path={`${paths.resetPassword}/:userId/:token`} element={<ResetPassword />} />
    </Route> */}


    <Route path="*" element={<NotFound />} />
  </Routes>
);
