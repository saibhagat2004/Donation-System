import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import App from './App.jsx'


// Create a QueryClient instance
const queryClient= new QueryClient({
  defaultOptions:{
    refetchOnWindowFocus: false,//React Query will refetch data when the user returns to the tab/window where your application is running. Setting this to false prevents this behavior, which can be useful if you want to minimize unnecessary network requests or if your data does not change frequently.
    //whenever the new tab is open or seen it prevent from data refetching minimize unnecessary netwoek request
  }
})
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
       <BrowserRouter>
      <QueryClientProvider client={queryClient}>

      <GoogleOAuthProvider clientId="192149123402-dde505u014sh32bi8rblk1feitetq9td.apps.googleusercontent.com">
         <App />  
         <ReactQueryDevtools initialIsOpen={false} />
      </GoogleOAuthProvider>     
 </QueryClientProvider>
    </BrowserRouter>
  
  </React.StrictMode>
);




