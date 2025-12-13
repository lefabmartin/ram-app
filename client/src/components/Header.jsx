import { Box, Container, Image, Link } from "@chakra-ui/react";

const Header = () => {
  return (
    <Box
      as="header"
      h="160px"
      bgImage="url('./assets/images/banner_2.jpg')"
      bgSize="cover"
      bgPos="bottom"
      position="relative"
      boxShadow="0 2px 10px rgba(0,0,0,0.1)">
      <Container maxW="1140px" h="full" position="relative">
        <Link href="/" display="block" w="208px" pt={4}>
          <Image
            src="./assets/images/ram_header_logo.png"
            alt="RAM Hand-to-Hand Couriers"
            w="208px"
            transition="all 0.3s"
            _hover={{ transform: "scale(1.02)" }}
          />
        </Link>
      </Container>
    </Box>
  );
};

export default Header;
