import { Box, Heading, Image, Spinner, Text } from '@metamask/snaps-sdk/jsx';

export type ActionHeaderProps = {
  title: string;
  subtitle: string;
  iconSrc?: string;
  isLoading?: boolean;
};

/**
 * ActionHeader component.
 *
 * @param props - The props for the ActionHeader component.
 * @param props.title - The title of the action header.
 * @param props.subtitle - The subtitle of the action header.
 * @param props.iconSrc - The icon source to display. The Snaps `Image` component supports both SVG strings and image URLs (e.g. PNG/JPEG).
 * @param props.isLoading - Renders a spinner IN PLACE OF THE ICON if true.
 * @returns The ActionHeader component.
 */
export const ActionHeader = ({
  title,
  subtitle,
  iconSrc,
  isLoading,
}: ActionHeaderProps) => {
  return (
    <Box alignment="center" center>
      <Box direction="horizontal" center>
        {isLoading ? <Spinner /> : null}
        {iconSrc && !isLoading ? (
          <Image borderRadius="full" src={iconSrc} width={16} height={16} />
        ) : null}
      </Box>
      <Heading size="lg">{title}</Heading>
      {subtitle ? <Text color="muted">{subtitle}</Text> : null}
    </Box>
  );
};
