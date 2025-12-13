import {
  Box,
  Container,
  Heading,
  Link,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";

const Footer = () => {
  const footerSections = [
    {
      title: "Company Information",
      links: [
        { text: "About Us", href: "/About" },
        { text: "No Sub-contracting", href: "/About/NoSubcontracting" },
        { text: "History", href: "/About/History" },
      ],
    },
    {
      title: "Services",
      links: [
        { text: "Local Courier Services", href: "/Services/Local" },
        { text: "Special Courier Services", href: "/Services/Special" },
        { text: "Distribution Services", href: "/Services/Distribution" },
        { text: "International Services", href: "/Services/International" },
        { text: "Warehousing Services", href: "/Services/Warehousing" },
      ],
    },
    {
      title: "Legal",
      links: [{ text: "Legal Documents", href: "/Legal" }],
    },
    {
      title: "Info",
      links: [
        {
          text: "Contact Us (Customer Service; Sales)",
          href: "/Contact/CustomerService",
        },
        { text: "Careers", href: "/Contact/Careers" },
        { text: "Payment Options", href: "/FAQ/Payments" },
        { text: "Fuel Surcharge", href: "/Services/Fuel" },
        { text: "FAQs", href: "/FAQ/" },
      ],
    },
  ];

  return (
    <>
      {/* Footer Line - Zone grise dégradée */}
      <Box
        h="36px"
        bg="linear-gradient(45deg, #6a6865 1%, #6b6765 15%, #6f6b67 26%, #6d6968 50%, #7b7474 71%, #7b7576 82%, #9d918c 100%)"
        boxShadow="inset 0 2px 5px rgba(0,0,0,0.2)"
      />
      <Box bg="#423f3f" color="white" py={8}>
        <Container maxW="1140px">
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6}>
            {footerSections.map((section, idx) => (
              <Box key={idx}>
                <Heading as="h2" size="sm" mb={4} color="white">
                  {section.title}
                </Heading>
                <Stack
                  spacing={2}
                  pl={6}
                  position="relative"
                  as="ul"
                  listStyleType="none">
                  {section.links.map((link, linkIdx) => (
                    <Box
                      as="li"
                      key={linkIdx}
                      position="relative"
                      _before={{
                        content: '""',
                        position: "absolute",
                        left: "-25px",
                        top: "50%",
                        transform: "translateY(-50%) rotate(45deg)",
                        w: "9px",
                        h: "2px",
                        bg: "white",
                        transformOrigin: "8px center",
                        borderRadius: "1px",
                      }}
                      _after={{
                        content: '""',
                        position: "absolute",
                        left: "-25px",
                        top: "50%",
                        transform: "translateY(-50%) rotate(-45deg)",
                        w: "9px",
                        h: "2px",
                        bg: "white",
                        transformOrigin: "8px center",
                        borderRadius: "1px",
                      }}>
                      <Link
                        href={link.href}
                        color="#949292"
                        _hover={{ color: "white", textDecoration: "none" }}
                        fontSize="sm">
                        {link.text}
                      </Link>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    </>
  );
};

export default Footer;
