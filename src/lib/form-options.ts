// Dropdown options for the membership form. Edit these lists to match the real office structure.

// Distribution zones first, then the other Chief Engineer offices.
export const ZONES = [
  "CHIEF ENGINEER/DS SOUTH ZONE PATIALA",
  "CHIEF ENGINEER/DS CENTRAL ZONE LUDHIANA",
  "CHIEF ENGINEER/DS NORTH ZONE JALANDHAR",
  "CHIEF ENGINEER/DS WEST ZONE BATHINDA",
  "CHIEF ENGINEER/DS BORDER ZONE AMRITSAR",
  "CHIEF ENGINEER/DS EAST ZONE MOHALI",
  "CHIEF ENGINEER/P&M LUDHIANA",
  "CHIEF ENGINEER/TA & I PATIALA",
  "CHIEF ENGINEER/EA & MMTS PATIALA",
  "CHIEF ENGINEER/FUEL PATIALA",
  "CHIEF ENGINEER/IT PATIALA",
  "CHIEF ENGINEER/DISTRIBUTION PROJECTS",
  "CHIEF ENGINEER/ARR PATIALA",
  "CHIEF ENGINEER/HYDEL PROJECTS PATIALA",
  "CHIEF ENGINEER/HRD PATIALA",
  "CHIEF ENGINEER/MM PATIALA",
  "CHIEF ENGINEER/PLANNING PATIALA",
  "CHIEF ENGINEER/COMMERCIAL PATIALA",
  "CHIEF ENGINEER/STORE & WORKSHOP LUDHIANA",
];

export const QUALIFICATIONS = ["ITI", "Diploma", "BE", "B.Tech", "M.Tech"] as const;

export const DISCIPLINES = ["Civil", "Electrical", "Mechanical"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not known"] as const;
export const HEADQUARTERS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur",
  "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Mohali", "Nawanshahr", "Pathankot", "Patiala",
  "Ropar", "Sangrur", "Sri Muktsar Sahib", "Tarn Taran",
];

export const DESIGNATIONS = [
  "JUNIOR ENGINEER (ELECTRICAL)",
  "JUNIOR ENGINEER (CIVIL)",
  "ADDITIONAL ASSISTANT ENGINEER (ELECTRICAL)",
  "ADDITIONAL ASSISTANT ENGINEER (CIVIL)",
  "ASSISTANT ENGINEER (ELECTRICAL)",
  "ASSISTANT ENGINEER (CIVIL)",
  "JUNIOR ENGINEER (MECHANICAL)",
  "ADDITIONAL ASSISTANT ENGINEER (MECHANICAL)",
  "ASSISTANT ENGINEER (MECHANICAL)",
];

export const MEMBERSHIP_TYPES = ["Monthly Membership (Rs.200/-)", "Yearly Membership (Rs.2000/-)"];
export const CARD_PAYMENT_LABELS = { pay_now: "Pay now (Rs.200/-)", pay_later: "Pay later (Rs.200/-)" } as const;
// No longer offered, but earlier applications may have them; still valid so the Master ID can save corrections.
export const LEGACY_MEMBERSHIP_TYPES = ["Ordinary", "Life", "Monthly Membership (Rs.250/-)", "Annual Membership (Rs.2400/-)", "Monthly Membership (Rs.190/-)", "Yearly Membership (Rs.2200/-)"];
