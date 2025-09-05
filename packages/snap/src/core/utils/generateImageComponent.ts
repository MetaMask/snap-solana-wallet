import { getImageComponent } from '@metamask/snaps-sdk';

import QUESTION_MARK_SVG from '../img/question-mark.svg';

export const generateImageComponent = async (
  imageUrl?: string,
  width = 48,
  height = 48,
) => {
  if (!imageUrl) {
    return QUESTION_MARK_SVG;
  }

  return getImageComponent(imageUrl, { width, height })
    .then((image) => image.value)
    .catch(() => QUESTION_MARK_SVG);
};
