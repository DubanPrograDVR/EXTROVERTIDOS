export const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  HASHTAGS: "hashtags",
  IMAGES: "images",
  INFORMATION: "information",
  LOCATION: "location",
  SCHEDULE: "schedule",
  CONTACT: "contact",
  MAP: "map",
};

export const isRealPublicationImage = (imageUrl) =>
  Boolean(imageUrl) && !String(imageUrl).includes("/img/Home1.png");

export const getRealPublicationImages = (images) =>
  Array.isArray(images) ? images.filter(isRealPublicationImage) : [];
