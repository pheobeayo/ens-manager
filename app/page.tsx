"use client";

import { Contract } from "ethers";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { pinata } from "@/utils/config";
import { MdSignalWifiStatusbarConnectedNoInternet } from "react-icons/md";
import { truncateAddr } from "@/utils/utils";
import { getENSContract } from "./services";
import Wrapper from "./components/shared/wrapper";
import { RegisterName } from "./components/shared/registerName";
import { OwnedNamesDisplay } from "./components/shared/ownedNames";
import { UpdateImage } from "./components/shared/updateImage";
import { UpdateAddress } from "./components/shared/updateAddress";
import { TransferName } from "./components/shared/transferName";

type ActiveTab = "register" | "check" | "owned" | "update-image" | "update-address" | "transfer";

export default function Home() {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [nameToCheck, setNameToCheck] = useState("");
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const { isConnected, address } = useAccount();
  const [contract, setContract] = useState<Contract | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("register");

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      const contractInstance: Contract = await getENSContract();
      setContract(contractInstance);
    };

    initContract();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }

    try {
      setUploading(true);
      const urlRequest = await fetch("/api/url");
      const urlResponse = await urlRequest.json();
      const upload = await pinata.upload.public.file(file).url(urlResponse.url);
      const fileUrl = await pinata.gateways.public.convert(upload.cid);
      setUrl(fileUrl);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target?.files?.[0]);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleNameClick = (name: string) => {
    console.log('Clicked name:', name);
    setMessage({
      type: 'info',
      text: `Viewing details for "${name}"`
    });
  };

  const checkNameAvailability = async () => {
    if (!contract || !nameToCheck.trim()) return;

    try {
      setCheckingName(true);
      const available = await contract.isNameAvailable(nameToCheck.trim());
      setNameAvailable(available);
      setCheckingName(false);
    } catch (error) {
      console.error('Name check error:', error);
      setCheckingName(false);
      handleError('Failed to check name availability');
    }
  };
  
  const handleRegistrationSuccess = (name: string, txHash: string) => {
    setMessage({
      type: "success",
      text: `Successfully registered "${name}"! Transaction: ${truncateAddr(txHash)}`,
    });
    setActiveTab("owned");
  };

  const handleUpdateSuccess = (type: string, name: string, txHash: string, extra?: string) => {
    let text = "";
    switch (type) {
      case "image":
        text = `Successfully updated image for "${name}"!`;
        break;
      case "address":
        text = `Successfully updated address for "${name}" to ${truncateAddr(extra!)}`;
        break;
      case "transfer":
        text = `Successfully transferred "${name}" to ${truncateAddr(extra!)}`;
        break;
    }
    setMessage({
      type: "success",
      text: `${text} Transaction: ${truncateAddr(txHash)}`,
    });
  };

  const handleError = (error: string) => {
    setMessage({
      type: "error",
      text: error,
    });
  };

  const tabs = [
    { id: "register" as ActiveTab, label: "Register", icon: "🆕", description: "Register new names" },
    { id: "check" as ActiveTab, label: "Check", icon: "🔍", description: "Check availability" },
    { id: "owned" as ActiveTab, label: "My Names", icon: "📋", description: "View owned names" },
    { id: "update-image" as ActiveTab, label: "Update Image", icon: "🖼️", description: "Change profile images" },
    { id: "update-address" as ActiveTab, label: "Update Address", icon: "🔄", description: "Change resolved addresses" },
    { id: "transfer" as ActiveTab, label: "Transfer", icon: "📤", description: "Transfer ownership" },
  ];

  if (!isConnected) {
    return (
      <Wrapper className="flex flex-col items-center justify-center h-[calc(100vh-160px)]">
        <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-md mx-auto border border-gray-800">
          <div className="bg-gray-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <MdSignalWifiStatusbarConnectedNoInternet className="text-gray-400 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to access the ENS Manager and manage your names.
          </p>
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 You'll need a Web3 wallet like MetaMask to get started
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="flex flex-col w-full min-h-[calc(100vh-160px)] py-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ENS Manager
          </h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Connected as {truncateAddr(address)}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Network</p>
            <p className="text-white font-medium">Lisk Sepolia Testnet</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border-l-4 ${
            message.type === "success"
              ? "bg-green-900/20 border-green-500 text-green-300"
              : message.type === "error"
              ? "bg-red-900/20 border-red-500 text-red-300"
              : "bg-blue-900/20 border-blue-500 text-blue-300"
          } animate-in slide-in-from-top duration-300`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">
              {message.type === "success" ? "✅" : message.type === "error" ? "❌" : "ℹ️"}
            </span>
            <p className="flex-1">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative p-4 rounded-xl border transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-gray-800"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">{tab.icon}</span>
              <span className="font-medium text-sm">{tab.label}</span>
              <span className="text-xs opacity-75 text-center hidden md:block">
                {tab.description}
              </span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
          {activeTab === 'register' && (
            <div className="p-6">
              <RegisterName
                contract={contract}
                onSuccess={handleRegistrationSuccess}
                onError={handleError}
              />
            </div>
          )}

          {activeTab === 'check' && (
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🔍</span>
                  <h2 className="text-2xl font-bold text-white">Check Name Availability</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={nameToCheck}
                      onChange={(e) => {
                        setNameToCheck(e.target.value);
                        setNameAvailable(null);
                      }}
                      placeholder="Enter name to check (e.g., alice)"
                      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      maxLength={64}
                    />
                    <button
                      onClick={checkNameAvailability}
                      disabled={!nameToCheck.trim() || checkingName}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors min-w-[100px]"
                    >
                      {checkingName ? 'Checking...' : 'Check'}
                    </button>
                  </div>

                  {nameAvailable === true && (
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 text-xl">✅</span>
                        <div>
                          <p className="text-green-400 font-medium">Name is available!</p>
                          <p className="text-green-300 text-sm">"{nameToCheck}" can be registered</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {nameAvailable === false && (
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 text-xl">❌</span>
                        <div>
                          <p className="text-red-400 font-medium">Name is taken</p>
                          <p className="text-red-300 text-sm">"{nameToCheck}" is already registered</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'owned' && (
            <div className="p-6">
              <OwnedNamesDisplay
                contract={contract}
                onError={handleError}
                onNameClick={handleNameClick}
              />
            </div>
          )}

          {activeTab === 'update-image' && (
            <div className="p-6">
              <UpdateImage
                contract={contract}
                userAddress={address}
                onSuccess={(name, txHash) => handleUpdateSuccess('image', name, txHash)}
                onError={handleError}
              />
            </div>
          )}

          {activeTab === 'update-address' && (
            <div className="p-6">
              <UpdateAddress
                contract={contract}
                onSuccess={(name, newAddress, txHash) => handleUpdateSuccess('address', name, txHash, newAddress)}
                onError={handleError}
              />
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="p-6">
              <TransferName
                contract={contract}
                onSuccess={(name, newOwner, txHash) => handleUpdateSuccess('transfer', name, txHash, newOwner)}
                onError={handleError}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>ENS Manager</span>
        </div>
        <div className="flex items-center gap-4">
          <span>🔒 Secure</span>
          <span>⚡ Fast</span>
          <span>🌐 Decentralized</span>
        </div>
      </div>
    </Wrapper>
  );
}