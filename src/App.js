import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import StakingRewards from "./components/StakingRewards";
import PriceOracle from "./components/PriceOracle";
import CreateJobPage from "./pages/CreateJobPage";
import DashboardPage from "./pages/DashboardPage";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import DevhubItem from "./pages/DevhubItem";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { baseSepolia, optimismSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import NotFound from "./components/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Devhub from "./pages/Devhub";
import ApiCreation from "./pages/Api/ApiCreation";
import BalanceMaintainer from "./components/BalanceMaintainer";
import { WalletProvider } from "./contexts/WalletContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import ServerErrorModal from "./components/common/ServerErrorModal";
import ScrollToTop from "./components/ScrollToTop";

const myCustomTheme = {
  blurs: {
    modalOverlay: "blur(5px)",
  },
  colors: {
    accentColor: "#F8FF7C",
    accentColorForeground: "black",
    actionButtonBorder: "white",
    actionButtonBorderMobile: "rgba(255, 255, 255, 0.25)",
    actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.25)",
    closeButton: "rgba(224, 232, 255, 0.8)",
    closeButtonBackground: "transparent",
    connectButtonBackground: "#F8FF7C",
    connectButtonBackgroundError: "#FF494A",
    connectButtonInnerBackground: "#F8FF7C",
    connectButtonText: "black",
    connectButtonTextError: "black",
    connectionIndicator: "#F8FF7C",
    downloadBottomCardBackground:
      "linear-gradient(126deg, rgba(0, 0, 0, 0.3) 9.49%, rgba(120, 120, 120, 0.4) 71.04%), #1A1B1F",
    downloadTopCardBackground:
      "linear-gradient(126deg, rgba(120, 120, 120, 0.4) 9.49%, rgba(0, 0, 0, 0.3) 71.04%), #1A1B1F",
    error: "#FF494A",
    generalBorder: "rgba(255, 255, 255, 0.25)",
    generalBorderDim: "rgba(255, 255, 255, 0.15)",
    menuItemBackground: "rgba(224, 232, 255, 0.3)",
    modalBackdrop: "rgba(0, 0, 0, 0.7)",
    modalBackground: "#0a0a0a",
    modalBorder: "white",
    modalText: "#FFF",
    modalTextDim: "rgba(224, 232, 255, 0.5)",
    modalTextSecondary: "rgba(255, 255, 255, 0.8)",
    profileAction: "rgba(224, 232, 255, 0.3)",
    profileActionHover: "rgba(224, 232, 255, 0.4)",
    profileForeground:
      "linear-gradient(112.07deg, #161515 26.66%, #252525 87.79%)",
    selectedOptionBorder: "rgba(224, 232, 255, 0.3)",
    standby: "#FFD641",
  },
  fonts: {
    body: "ActayRegular",
  },
  radii: {
    actionButton: "4px",
    connectButton: "50px",
    menuButton: "4px",
    modal: "8px",
    modalMobile: "8px",
  },
  shadows: {
    connectButton: "0px 4px 12px rgba(0, 0, 0, 0.3)",
    dialog: "0px 8px 32px rgba(0, 0, 0, 0.5)",
    profileDetailsAction: "0px 2px 6px rgba(37, 41, 46, 0.2)",
    selectedOption: "0px 2px 6px rgba(0, 0, 0, 0.4)",
    selectedWallet: "0px 2px 6px rgba(0, 0, 0, 0.4)",
    walletLogo: "0px 2px 16px rgba(0, 0, 0, 0.3)",
  },
};

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "f8a6524307e28135845a9fe5811fcaa2",
  chains: [baseSepolia, optimismSepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
  autoConnect: false, // Disable autoConnect

});

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={myCustomTheme}>
            <ErrorProvider>
              <ServerErrorModal />
              <WalletProvider>
                <Router>
                  <ScrollToTop />
                  <Layout>
                    <Helmet defaultTitle="TriggerX" titleTemplate="%s | TriggerX">
                      <meta
                        name="description"
                        content="TriggerX - Web3 Automation Platform"
                      />
                      <meta property="og:type" content="website" />
                      <meta property="og:site_name" content="TriggerX" />
                    </Helmet>
                    <Routes>
                      <>
                        <Route path="/" element={<CreateJobPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/devhub" element={<Devhub />} />
                        <Route path="/devhub/:slug" element={<DevhubItem />} />
                        <Route path="/api" element={<ApiCreation />} />
                        <Route
                          path="/eth-top-ups-example"
                          element={<BalanceMaintainer />}
                        />
                        <Route
                          path="/staking-rewards"
                          element={<StakingRewards />}
                        />
                        <Route path="/price-oracle" element={<PriceOracle />} />
                        <Route path="*" element={<NotFound />} />
                      </>
                    </Routes>
                  </Layout>
                </Router>
              </WalletProvider>
            </ErrorProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </HelmetProvider>
  );
};

export default App;
