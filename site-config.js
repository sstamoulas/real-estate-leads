// Replace the placeholders below with your actual business details, website domain, lead endpoint, and calendar URL.
window.RENTAL_SITE_CONFIG = {
  businessName: "Georgia Stavrou Rentals",
  ownerName: "Georgia Stavrou",
  brokerageName: "Coldwell Banker",
  market: "Baltimore City, Baltimore County, Harford County, Cecil County, and Howard County",
  contactEmail: "georgia07.realtor@gmail.com",
  contactPhone: "(410) 555-0148",
  websiteLabel: "georgiastavrourentals.com",
  websiteUrl: "https://georgiastavrourentals.com",
  leadEndpoint: "/.netlify/functions/send-lead",
  calendarUrl: "",
  listings: [
    {
      title: "Maple Street Residence",
      price: "$2,250 / mo",
      beds: "2 bd",
      baths: "2 ba",
      area: "Northside",
      status: "Available now",
      description:
        "Updated two-bedroom home with in-unit laundry, driveway parking, and a clean layout for quick lease-up.",
      tags: ["Pet-friendly", "Parking", "In-unit laundry"],
    },
    {
      title: "Parkside Duplex",
      price: "$2,450 / mo",
      beds: "3 bd",
      baths: "1.5 ba",
      area: "Park District",
      status: "Tours this week",
      description:
        "Bright duplex near transit and neighborhood retail, ideal for renters who want a move-in ready space.",
      tags: ["Near transit", "Updated kitchen", "Private entry"],
    },
    {
      title: "Downtown Loft",
      price: "$1,850 / mo",
      beds: "Studio",
      baths: "1 ba",
      area: "Central",
      status: "Coming soon",
      description:
        "Loft-style unit with tall ceilings, flexible lease terms, and strong appeal for young professionals.",
      tags: ["Loft layout", "Walkable", "Flexible lease"],
    },
  ],
  showingSlots: [
    { dayOffset: 1, time: "16:30", label: "Tomorrow at 4:30 PM" },
    { dayOffset: 2, time: "11:00", label: "In two days at 11:00 AM" },
    { dayOffset: 4, time: "18:00", label: "Later this week at 6:00 PM" },
    { dayOffset: 6, time: "10:00", label: "Weekend at 10:00 AM" },
  ],
};
