import { apiClient } from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';
import { paths } from '@/routes';
import { PopupError } from '@/utils/alertMessage';
import { dateFormatter } from '@/utils/errorFormatter';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const Checkout = ({}) => {
  const [searchParams] = useSearchParams();
  const invoice = searchParams.get('invoice');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState({
    _id: '',
    subscription_level: '',
    amount: '0'
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await apiClient.get(`${endpoints.fetchInvoice}/${invoice}`);

        setInvoiceDetails(response.data);
      } catch (error) {
        setError(`${error?.response?.data?.message || 'An error occured'}`);
      }
    };

    if (invoice) fetchInvoice();
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await apiClient.post(endpoints.makePayment, { invoice });

      window.location.href = response.data.redirect_url;
      //  window.open(response.data.redirect_url, '_blank'); new tab
    } catch (error) {
      setError(`${error.response.data.message || 'An Error Occured'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-8 sm:my-16 bg-white rounded-lg ring-1 ring-gray">
      {error && <PopupError message={error} />}
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto p-4 sm:pb-8 max-w-[64rem]">
          <h2 className="font-semibold text-dark text-xl">Payment</h2>

          <div className="sm:mt-8 mt-6 lg:flex lg:gap-8 items-start">
            <form className="w-full lg:max-w-[36rem]" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between border rounded-lg bg-light-gray p-4 ps-4 border-gray">
                <img
                  src="/assets/paystack.webp"
                  width={400}
                  height={200}
                  className="w-full"
                  alt="paystack"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-light-green transition-colors duration-200 hover:bg-green text-white py-2 px-3 rounded-lg mt-6 border border-transparent border-none"
              >
                {loading ? 'Please wait...' : 'Pay now'}
              </button>

              <div className="my-5 w-full flex items-center">
                <div className="bg-gray h-[1px] flex-1"></div>
                <div className="">or</div>
                <div className="bg-gray h-[1px] flex-1"></div>
              </div>

              <div className=" border rounded-lg bg-light-gray p-4 ps-4 border-gray">
                <h2 className="text-center font-bold mb-2">Pay Directly Into Our Bank Account</h2>
                <p className="font-bold text-xs md:text-md">
                  Account Name:
                  <span className=" text-2xs  md:text-sm   font-semibold">
                    Cheapay Global Connect Ltd
                  </span>{' '}
                </p>
                <p className="font-bold text-xs md:text-md">
                  Account Number:{' '}
                  <span className=" text-2xs  md:text-sm   font-semibold">2392762999</span>{' '}
                </p>
                <p className="font-bold text-xs md:text-md">
                  Bank: <span className=" text-2xs  md:text-sm   font-semibold">Access Bank</span>{' '}
                </p>

                <p className="text-danger">
                  Notice: ⚠
                  <span className=" ml-3 italic md:text-sm text-dark text-2xs">
                    If You pay via direct bank transfer, please send us proof of payment and this
                    invoice number via email, at sales@made-n-nigeria.com
                  </span>
                </p>
              </div>
            </form>

            <div className="grow lg:mt-0 sm:mt-8 mt-6">
              <div className="rounded-lg border border-gray bg-light-gray p-6">
                <div>
                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-dark-gray font-medium">Total Price</dt>
                    <dd className="font-medium text-dark"> ₦ {invoiceDetails?.amount}.00</dd>
                  </dl>

                  <dl className="mt-2 flex items-center justify-between gap-4">
                    <dt className="text-dark-gray font-medium">Details</dt>
                    <dd className=" text-dark text-2xs capitalize">
                      {invoiceDetails?.memmbership_level} subscription
                    </dd>
                  </dl>
                </div>

                <dl className="mt-2 flex items-center justify-between gap-4">
                  <dt className="text-dark-gray font-medium">Invoice BY</dt>
                  <dd className="text-dark text-2xs capitalize">
                    {invoiceDetails?.staffId?.first_name} {invoiceDetails?.staffId?.last_name}
                  </dd>
                </dl>
                <dl className="mt-2 flex items-center justify-between gap-4">
                  <dt className="text-dark-gray font-medium">Date</dt>
                  <dd className="text-dark text-2xs">{dateFormatter(invoiceDetails?.createdAt)}</dd>
                </dl>
              </div>

              <div className=" mt-6 rounded-lg border border-gray bg-light-gray p-6">
                <div className="gap-4 sm:flex">
                  <div className="flex items-center justify-center h-12 w-12 shrink-0 sm:mb-0 mb-4 rounded-lg bg-gray">
                    <svg
                      className="block shrink-0 w-6 h-6 text-dark-gray"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.891 15.107 15.11 8.89m-5.183-.52h.01m3.089 7.254h.01M14.08 3.902a2.849 2.849 0 0 0 2.176.902 2.845 2.845 0 0 1 2.94 2.94 2.849 2.849 0 0 0 .901 2.176 2.847 2.847 0 0 1 0 4.16 2.848 2.848 0 0 0-.901 2.175 2.843 2.843 0 0 1-2.94 2.94 2.848 2.848 0 0 0-2.176.902 2.847 2.847 0 0 1-4.16 0 2.85 2.85 0 0 0-2.176-.902 2.845 2.845 0 0 1-2.94-2.94 2.848 2.848 0 0 0-.901-2.176 2.848 2.848 0 0 1 0-4.16 2.849 2.849 0 0 0 .901-2.176 2.845 2.845 0 0 1 2.941-2.94 2.849 2.849 0 0 0 2.176-.901 2.847 2.847 0 0 1 4.159 0Z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium text-dark"> Disclaimer</h4>
                    <p className="mb-2 text-sm text-dark-gray">
                      Please note that all payments are secure and managed by a third-party payment
                      provider, Paystack.
                    </p>
                    <Link
                      to={paths.privacyPolicy}
                      target="_blank"
                      className="text-sm font-medium inline-flex text-green hover:underline hover:underline-offset-2"
                    >
                      Visit our Privacy Policy
                      <svg
                        className="ms-2 w-5 h-5 block shrink-0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 12H5m14 0-4 4m4-4-4-4"
                        ></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
