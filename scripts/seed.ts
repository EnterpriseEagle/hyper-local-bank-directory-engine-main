import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { suburbs, banks, branches } from "../src/lib/db/schema";

const client = createClient({ url: "file:./data/banknearme.db" });
const db = drizzle(client);

const STATES: Record<string, string> = {
  NSW: "new-south-wales",
  VIC: "victoria",
  QLD: "queensland",
  WA: "western-australia",
  SA: "south-australia",
  TAS: "tasmania",
  NT: "northern-territory",
  ACT: "australian-capital-territory",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Realistic Australian suburb data (representative sample across all states)
const SUBURB_DATA: { name: string; postcode: string; state: string; lat: number; lng: number; pop: number }[] = [
  // NSW - Major
  { name: "Sydney", postcode: "2000", state: "NSW", lat: -33.8688, lng: 151.2093, pop: 17000 },
  { name: "Parramatta", postcode: "2150", state: "NSW", lat: -33.8151, lng: 151.0011, pop: 30000 },
  { name: "Bondi", postcode: "2026", state: "NSW", lat: -33.8914, lng: 151.2743, pop: 10000 },
  { name: "Manly", postcode: "2095", state: "NSW", lat: -33.7969, lng: 151.2877, pop: 16000 },
  { name: "Surry Hills", postcode: "2010", state: "NSW", lat: -33.8833, lng: 151.2119, pop: 15000 },
  { name: "Newtown", postcode: "2042", state: "NSW", lat: -33.8976, lng: 151.1790, pop: 14000 },
  { name: "Chatswood", postcode: "2067", state: "NSW", lat: -33.7969, lng: 151.1832, pop: 24000 },
  { name: "Penrith", postcode: "2750", state: "NSW", lat: -33.7507, lng: 150.6944, pop: 12000 },
  { name: "Liverpool", postcode: "2170", state: "NSW", lat: -33.9200, lng: 150.9238, pop: 27000 },
  { name: "Blacktown", postcode: "2148", state: "NSW", lat: -33.7688, lng: 150.9063, pop: 47000 },
  { name: "Hornsby", postcode: "2077", state: "NSW", lat: -33.7025, lng: 151.0994, pop: 21000 },
  { name: "Bankstown", postcode: "2200", state: "NSW", lat: -33.9180, lng: 151.0335, pop: 33000 },
  { name: "Hurstville", postcode: "2220", state: "NSW", lat: -33.9668, lng: 151.1003, pop: 28000 },
  { name: "Dee Why", postcode: "2099", state: "NSW", lat: -33.7507, lng: 151.2879, pop: 20000 },
  { name: "Cronulla", postcode: "2230", state: "NSW", lat: -34.0554, lng: 151.1518, pop: 18000 },
  { name: "Wollongong", postcode: "2500", state: "NSW", lat: -34.4278, lng: 150.8931, pop: 30000 },
  { name: "Newcastle", postcode: "2300", state: "NSW", lat: -32.9283, lng: 151.7817, pop: 34000 },
  { name: "Gosford", postcode: "2250", state: "NSW", lat: -33.4251, lng: 151.3419, pop: 18000 },
  { name: "Coffs Harbour", postcode: "2450", state: "NSW", lat: -30.2963, lng: 153.1138, pop: 28000 },
  { name: "Dubbo", postcode: "2830", state: "NSW", lat: -32.2427, lng: 148.6012, pop: 38000 },
  { name: "Tamworth", postcode: "2340", state: "NSW", lat: -31.0927, lng: 150.9322, pop: 42000 },
  { name: "Orange", postcode: "2800", state: "NSW", lat: -33.2836, lng: 149.1013, pop: 40000 },
  { name: "Wagga Wagga", postcode: "2650", state: "NSW", lat: -35.1082, lng: 147.3598, pop: 56000 },
  { name: "Albury", postcode: "2640", state: "NSW", lat: -36.0737, lng: 146.9135, pop: 51000 },
  { name: "Bathurst", postcode: "2795", state: "NSW", lat: -33.4196, lng: 149.5798, pop: 37000 },
  { name: "Lismore", postcode: "2480", state: "NSW", lat: -28.8135, lng: 153.2757, pop: 28000 },
  { name: "Broken Hill", postcode: "2880", state: "NSW", lat: -31.9505, lng: 141.4539, pop: 18000 },
  { name: "Mosman", postcode: "2088", state: "NSW", lat: -33.8292, lng: 151.2441, pop: 30000 },
  { name: "Randwick", postcode: "2031", state: "NSW", lat: -33.9111, lng: 151.2413, pop: 29000 },
  { name: "Marrickville", postcode: "2204", state: "NSW", lat: -33.9112, lng: 151.1553, pop: 27000 },
  // VIC - Major
  { name: "Melbourne", postcode: "3000", state: "VIC", lat: -37.8136, lng: 144.9631, pop: 37000 },
  { name: "St Kilda", postcode: "3182", state: "VIC", lat: -37.8676, lng: 144.9804, pop: 20000 },
  { name: "Richmond", postcode: "3121", state: "VIC", lat: -37.8241, lng: 144.9994, pop: 28000 },
  { name: "Fitzroy", postcode: "3065", state: "VIC", lat: -37.8000, lng: 144.9783, pop: 11000 },
  { name: "South Yarra", postcode: "3141", state: "VIC", lat: -37.8381, lng: 144.9929, pop: 23000 },
  { name: "Brunswick", postcode: "3056", state: "VIC", lat: -37.7667, lng: 144.9601, pop: 24000 },
  { name: "Footscray", postcode: "3011", state: "VIC", lat: -37.8000, lng: 144.8990, pop: 16000 },
  { name: "Box Hill", postcode: "3128", state: "VIC", lat: -37.8187, lng: 145.1218, pop: 11000 },
  { name: "Dandenong", postcode: "3175", state: "VIC", lat: -37.9872, lng: 145.2149, pop: 29000 },
  { name: "Frankston", postcode: "3199", state: "VIC", lat: -38.1445, lng: 145.1228, pop: 36000 },
  { name: "Geelong", postcode: "3220", state: "VIC", lat: -38.1499, lng: 144.3617, pop: 33000 },
  { name: "Ballarat", postcode: "3350", state: "VIC", lat: -37.5622, lng: 143.8503, pop: 40000 },
  { name: "Bendigo", postcode: "3550", state: "VIC", lat: -36.7570, lng: 144.2794, pop: 41000 },
  { name: "Shepparton", postcode: "3630", state: "VIC", lat: -36.3833, lng: 145.3987, pop: 31000 },
  { name: "Warrnambool", postcode: "3280", state: "VIC", lat: -38.3818, lng: 142.4880, pop: 35000 },
  { name: "Traralgon", postcode: "3844", state: "VIC", lat: -38.1966, lng: 146.5348, pop: 27000 },
  { name: "Mildura", postcode: "3500", state: "VIC", lat: -34.2086, lng: 142.1312, pop: 33000 },
  { name: "Preston", postcode: "3072", state: "VIC", lat: -37.7500, lng: 145.0167, pop: 31000 },
  { name: "Heidelberg", postcode: "3084", state: "VIC", lat: -37.7561, lng: 145.0667, pop: 6000 },
  { name: "Werribee", postcode: "3030", state: "VIC", lat: -37.9000, lng: 144.6631, pop: 40000 },
  { name: "Sunbury", postcode: "3429", state: "VIC", lat: -37.5786, lng: 144.7264, pop: 37000 },
  { name: "Craigieburn", postcode: "3064", state: "VIC", lat: -37.6009, lng: 144.9432, pop: 54000 },
  { name: "Caroline Springs", postcode: "3023", state: "VIC", lat: -37.7369, lng: 144.7369, pop: 28000 },
  // QLD - Major
  { name: "Brisbane", postcode: "4000", state: "QLD", lat: -27.4698, lng: 153.0251, pop: 21000 },
  { name: "Gold Coast", postcode: "4217", state: "QLD", lat: -28.0167, lng: 153.4000, pop: 23000 },
  { name: "Stafford", postcode: "4053", state: "QLD", lat: -27.4136, lng: 153.0109, pop: 12000 },
  { name: "Cairns", postcode: "4870", state: "QLD", lat: -16.9186, lng: 145.7781, pop: 17000 },
  { name: "Townsville", postcode: "4810", state: "QLD", lat: -19.2589, lng: 146.8169, pop: 18000 },
  { name: "Toowoomba", postcode: "4350", state: "QLD", lat: -27.5598, lng: 151.9507, pop: 36000 },
  { name: "Rockhampton", postcode: "4700", state: "QLD", lat: -23.3791, lng: 150.5100, pop: 30000 },
  { name: "Mackay", postcode: "4740", state: "QLD", lat: -21.1411, lng: 149.1861, pop: 29000 },
  { name: "Bundaberg", postcode: "4670", state: "QLD", lat: -24.8662, lng: 152.3489, pop: 24000 },
  { name: "Hervey Bay", postcode: "4655", state: "QLD", lat: -25.2889, lng: 152.8411, pop: 35000 },
  { name: "Noosa", postcode: "4567", state: "QLD", lat: -26.3933, lng: 153.0742, pop: 5000 },
  { name: "Surfers Paradise", postcode: "4217", state: "QLD", lat: -28.0031, lng: 153.4296, pop: 23000 },
  { name: "Ipswich", postcode: "4305", state: "QLD", lat: -27.6167, lng: 152.7667, pop: 14000 },
  { name: "Logan", postcode: "4114", state: "QLD", lat: -27.6408, lng: 153.1092, pop: 17000 },
  { name: "Redcliffe", postcode: "4020", state: "QLD", lat: -27.2285, lng: 153.1005, pop: 14000 },
  { name: "Caboolture", postcode: "4510", state: "QLD", lat: -27.0847, lng: 152.9511, pop: 26000 },
  { name: "Gladstone", postcode: "4680", state: "QLD", lat: -23.8490, lng: 151.2689, pop: 24000 },
  { name: "Mount Isa", postcode: "4825", state: "QLD", lat: -20.7256, lng: 139.4927, pop: 22000 },
  { name: "Gumlow", postcode: "4815", state: "QLD", lat: -19.2700, lng: 146.7450, pop: 2000 },
  { name: "Chermside", postcode: "4032", state: "QLD", lat: -27.3886, lng: 153.0358, pop: 9000 },
  { name: "Indooroopilly", postcode: "4068", state: "QLD", lat: -27.5006, lng: 152.9765, pop: 12000 },
  { name: "Nundah", postcode: "4012", state: "QLD", lat: -27.3906, lng: 153.0614, pop: 12000 },
  { name: "Wynnum", postcode: "4178", state: "QLD", lat: -27.4444, lng: 153.1686, pop: 13000 },
  // WA - Major
  { name: "Perth", postcode: "6000", state: "WA", lat: -31.9505, lng: 115.8605, pop: 28000 },
  { name: "Fremantle", postcode: "6160", state: "WA", lat: -32.0569, lng: 115.7439, pop: 8000 },
  { name: "Joondalup", postcode: "6027", state: "WA", lat: -31.7467, lng: 115.7677, pop: 31000 },
  { name: "Rockingham", postcode: "6168", state: "WA", lat: -32.2921, lng: 115.7245, pop: 14000 },
  { name: "Mandurah", postcode: "6210", state: "WA", lat: -32.5269, lng: 115.7217, pop: 34000 },
  { name: "Bunbury", postcode: "6230", state: "WA", lat: -33.3271, lng: 115.6414, pop: 34000 },
  { name: "Geraldton", postcode: "6530", state: "WA", lat: -28.7744, lng: 114.6150, pop: 21000 },
  { name: "Kalgoorlie", postcode: "6430", state: "WA", lat: -30.7490, lng: 121.4660, pop: 30000 },
  { name: "Subiaco", postcode: "6008", state: "WA", lat: -31.9454, lng: 115.8271, pop: 18000 },
  { name: "Nedlands", postcode: "6009", state: "WA", lat: -31.9812, lng: 115.8050, pop: 21000 },
  { name: "Scarborough", postcode: "6019", state: "WA", lat: -31.8932, lng: 115.7631, pop: 15000 },
  { name: "Morley", postcode: "6062", state: "WA", lat: -31.8889, lng: 115.9051, pop: 20000 },
  { name: "Karratha", postcode: "6714", state: "WA", lat: -20.7377, lng: 116.8463, pop: 17000 },
  { name: "Broome", postcode: "6725", state: "WA", lat: -17.9614, lng: 122.2359, pop: 14000 },
  { name: "Albany", postcode: "6330", state: "WA", lat: -35.0275, lng: 117.8847, pop: 35000 },
  // SA - Major
  { name: "Adelaide", postcode: "5000", state: "SA", lat: -34.9285, lng: 138.6007, pop: 25000 },
  { name: "Glenelg", postcode: "5045", state: "SA", lat: -34.9811, lng: 138.5115, pop: 9000 },
  { name: "Norwood", postcode: "5067", state: "SA", lat: -34.9213, lng: 138.6332, pop: 5000 },
  { name: "Mount Gambier", postcode: "5290", state: "SA", lat: -37.8317, lng: 140.7746, pop: 28000 },
  { name: "Port Augusta", postcode: "5700", state: "SA", lat: -32.4910, lng: 137.7831, pop: 14000 },
  { name: "Whyalla", postcode: "5600", state: "SA", lat: -33.0300, lng: 137.5246, pop: 21000 },
  { name: "Murray Bridge", postcode: "5253", state: "SA", lat: -35.1185, lng: 139.2735, pop: 18000 },
  { name: "Victor Harbor", postcode: "5211", state: "SA", lat: -35.5521, lng: 138.6173, pop: 15000 },
  { name: "Port Lincoln", postcode: "5606", state: "SA", lat: -34.7328, lng: 135.8586, pop: 15000 },
  { name: "Unley", postcode: "5061", state: "SA", lat: -34.9505, lng: 138.6078, pop: 8000 },
  { name: "Prospect", postcode: "5082", state: "SA", lat: -34.8838, lng: 138.5949, pop: 21000 },
  { name: "Modbury", postcode: "5092", state: "SA", lat: -34.8333, lng: 138.6833, pop: 10000 },
  // TAS
  { name: "Hobart", postcode: "7000", state: "TAS", lat: -42.8821, lng: 147.3272, pop: 53000 },
  { name: "Launceston", postcode: "7250", state: "TAS", lat: -41.4332, lng: 147.1441, pop: 68000 },
  { name: "Devonport", postcode: "7310", state: "TAS", lat: -41.1740, lng: 146.3568, pop: 30000 },
  { name: "Burnie", postcode: "7320", state: "TAS", lat: -41.0564, lng: 145.9066, pop: 20000 },
  { name: "Sandy Bay", postcode: "7005", state: "TAS", lat: -42.9000, lng: 147.3333, pop: 9000 },
  { name: "Kingston", postcode: "7050", state: "TAS", lat: -42.9750, lng: 147.3062, pop: 15000 },
  { name: "Glenorchy", postcode: "7010", state: "TAS", lat: -42.8333, lng: 147.2833, pop: 46000 },
  { name: "Ulverstone", postcode: "7315", state: "TAS", lat: -41.1569, lng: 146.1704, pop: 14000 },
  // NT
  { name: "Darwin", postcode: "0800", state: "NT", lat: -12.4634, lng: 130.8456, pop: 82000 },
  { name: "Alice Springs", postcode: "0870", state: "NT", lat: -23.6980, lng: 133.8807, pop: 25000 },
  { name: "Palmerston", postcode: "0830", state: "NT", lat: -12.4870, lng: 130.9849, pop: 35000 },
  { name: "Katherine", postcode: "0850", state: "NT", lat: -14.4667, lng: 132.2667, pop: 6000 },
  { name: "Casuarina", postcode: "0810", state: "NT", lat: -12.3723, lng: 130.8719, pop: 12000 },
  { name: "Tennant Creek", postcode: "0860", state: "NT", lat: -19.6500, lng: 134.1833, pop: 3100 },
  // ACT
  { name: "Canberra", postcode: "2600", state: "ACT", lat: -35.2809, lng: 149.1300, pop: 5000 },
  { name: "Belconnen", postcode: "2617", state: "ACT", lat: -35.2381, lng: 149.0661, pop: 28000 },
  { name: "Woden", postcode: "2606", state: "ACT", lat: -35.3489, lng: 149.0856, pop: 2000 },
  { name: "Tuggeranong", postcode: "2900", state: "ACT", lat: -35.4244, lng: 149.0888, pop: 22000 },
  { name: "Gungahlin", postcode: "2912", state: "ACT", lat: -35.1850, lng: 149.1339, pop: 18000 },
  { name: "Civic", postcode: "2601", state: "ACT", lat: -35.2802, lng: 149.1291, pop: 4000 },
  { name: "Dickson", postcode: "2602", state: "ACT", lat: -35.2500, lng: 149.1394, pop: 3000 },
  { name: "Weston Creek", postcode: "2611", state: "ACT", lat: -35.3452, lng: 149.0597, pop: 11000 },
  // Additional NSW suburbs for long-tail depth
  { name: "Baulkham Hills", postcode: "2153", state: "NSW", lat: -33.7621, lng: 150.9930, pop: 38000 },
  { name: "Castle Hill", postcode: "2154", state: "NSW", lat: -33.7314, lng: 151.0000, pop: 37000 },
  { name: "Ryde", postcode: "2112", state: "NSW", lat: -33.8153, lng: 151.1049, pop: 30000 },
  { name: "Epping", postcode: "2121", state: "NSW", lat: -33.7726, lng: 151.0819, pop: 24000 },
  { name: "Strathfield", postcode: "2135", state: "NSW", lat: -33.8755, lng: 151.0940, pop: 24000 },
  { name: "Burwood", postcode: "2134", state: "NSW", lat: -33.8778, lng: 151.1039, pop: 35000 },
  { name: "Ashfield", postcode: "2131", state: "NSW", lat: -33.8892, lng: 151.1264, pop: 24000 },
  { name: "Canterbury", postcode: "2193", state: "NSW", lat: -33.9106, lng: 151.1185, pop: 11000 },
  { name: "Lakemba", postcode: "2195", state: "NSW", lat: -33.9194, lng: 151.0750, pop: 18000 },
  { name: "Cabramatta", postcode: "2166", state: "NSW", lat: -33.8950, lng: 150.9375, pop: 21000 },
  { name: "Fairfield", postcode: "2165", state: "NSW", lat: -33.8703, lng: 150.9567, pop: 19000 },
  { name: "Campbelltown", postcode: "2560", state: "NSW", lat: -34.0650, lng: 150.8142, pop: 30000 },
  { name: "Sutherland", postcode: "2232", state: "NSW", lat: -34.0310, lng: 151.0568, pop: 22000 },
  { name: "Miranda", postcode: "2228", state: "NSW", lat: -34.0364, lng: 151.1009, pop: 12000 },
  { name: "Kogarah", postcode: "2217", state: "NSW", lat: -33.9667, lng: 151.1333, pop: 14000 },
  { name: "Rockdale", postcode: "2216", state: "NSW", lat: -33.9533, lng: 151.1381, pop: 27000 },
  { name: "Maroubra", postcode: "2035", state: "NSW", lat: -33.9500, lng: 151.2333, pop: 30000 },
  { name: "Coogee", postcode: "2034", state: "NSW", lat: -33.9220, lng: 151.2566, pop: 15000 },
  { name: "Neutral Bay", postcode: "2089", state: "NSW", lat: -33.8330, lng: 151.2177, pop: 11000 },
  { name: "Cremorne", postcode: "2090", state: "NSW", lat: -33.8284, lng: 151.2268, pop: 9000 },
  { name: "Lane Cove", postcode: "2066", state: "NSW", lat: -33.8167, lng: 151.1667, pop: 12000 },
  { name: "Willoughby", postcode: "2068", state: "NSW", lat: -33.7984, lng: 151.2038, pop: 7000 },
  { name: "Kirribilli", postcode: "2061", state: "NSW", lat: -33.8465, lng: 151.2175, pop: 6000 },
  { name: "Paddington", postcode: "2021", state: "NSW", lat: -33.8843, lng: 151.2268, pop: 14000 },
  { name: "Woollahra", postcode: "2025", state: "NSW", lat: -33.8885, lng: 151.2476, pop: 8000 },
  { name: "Double Bay", postcode: "2028", state: "NSW", lat: -33.8778, lng: 151.2429, pop: 5000 },
  { name: "Rozelle", postcode: "2039", state: "NSW", lat: -33.8621, lng: 151.1726, pop: 10000 },
  { name: "Balmain", postcode: "2041", state: "NSW", lat: -33.8562, lng: 151.1796, pop: 10000 },
  { name: "Leichhardt", postcode: "2040", state: "NSW", lat: -33.8833, lng: 151.1569, pop: 14000 },
  { name: "Glebe", postcode: "2037", state: "NSW", lat: -33.8786, lng: 151.1860, pop: 12000 },
  { name: "Redfern", postcode: "2016", state: "NSW", lat: -33.8933, lng: 151.2044, pop: 13000 },
  { name: "Waterloo", postcode: "2017", state: "NSW", lat: -33.9011, lng: 151.2065, pop: 16000 },
  { name: "Alexandria", postcode: "2015", state: "NSW", lat: -33.9070, lng: 151.1964, pop: 10000 },
  { name: "Mascot", postcode: "2020", state: "NSW", lat: -33.9292, lng: 151.1925, pop: 15000 },
  { name: "Botany", postcode: "2019", state: "NSW", lat: -33.9431, lng: 151.1982, pop: 10000 },
  // Additional VIC
  { name: "Collingwood", postcode: "3066", state: "VIC", lat: -37.8028, lng: 144.9878, pop: 8000 },
  { name: "Carlton", postcode: "3053", state: "VIC", lat: -37.8000, lng: 144.9667, pop: 17000 },
  { name: "Prahran", postcode: "3181", state: "VIC", lat: -37.8500, lng: 144.9917, pop: 12000 },
  { name: "Toorak", postcode: "3142", state: "VIC", lat: -37.8443, lng: 145.0160, pop: 13000 },
  { name: "Hawthorn", postcode: "3122", state: "VIC", lat: -37.8225, lng: 145.0329, pop: 23000 },
  { name: "Camberwell", postcode: "3124", state: "VIC", lat: -37.8433, lng: 145.0627, pop: 19000 },
  { name: "Glen Waverley", postcode: "3150", state: "VIC", lat: -37.8784, lng: 145.1651, pop: 40000 },
  { name: "Chadstone", postcode: "3148", state: "VIC", lat: -37.8833, lng: 145.0833, pop: 8000 },
  { name: "Doncaster", postcode: "3108", state: "VIC", lat: -37.7831, lng: 145.1269, pop: 23000 },
  { name: "Ringwood", postcode: "3134", state: "VIC", lat: -37.8142, lng: 145.2283, pop: 18000 },
  { name: "Eltham", postcode: "3095", state: "VIC", lat: -37.7142, lng: 145.1483, pop: 18000 },
  { name: "Brighton", postcode: "3186", state: "VIC", lat: -37.9082, lng: 144.9905, pop: 23000 },
  { name: "Williamstown", postcode: "3016", state: "VIC", lat: -37.8667, lng: 144.8833, pop: 14000 },
  { name: "Maribyrnong", postcode: "3032", state: "VIC", lat: -37.7733, lng: 144.8900, pop: 11000 },
  { name: "Coburg", postcode: "3058", state: "VIC", lat: -37.7454, lng: 144.9660, pop: 26000 },
  { name: "Northcote", postcode: "3070", state: "VIC", lat: -37.7690, lng: 144.9993, pop: 25000 },
  // Additional QLD
  { name: "Fortitude Valley", postcode: "4006", state: "QLD", lat: -27.4560, lng: 153.0364, pop: 7000 },
  { name: "South Bank", postcode: "4101", state: "QLD", lat: -27.4818, lng: 153.0224, pop: 6000 },
  { name: "West End", postcode: "4101", state: "QLD", lat: -27.4817, lng: 153.0055, pop: 10000 },
  { name: "Paddington", postcode: "4064", state: "QLD", lat: -27.4576, lng: 152.9991, pop: 9000 },
  { name: "Toowong", postcode: "4066", state: "QLD", lat: -27.4843, lng: 152.9889, pop: 11000 },
  { name: "Bulimba", postcode: "4171", state: "QLD", lat: -27.4543, lng: 153.0589, pop: 8000 },
  { name: "Clayfield", postcode: "4011", state: "QLD", lat: -27.4175, lng: 153.0575, pop: 9000 },
  { name: "Ascot", postcode: "4007", state: "QLD", lat: -27.4331, lng: 153.0608, pop: 5000 },
  { name: "Carindale", postcode: "4152", state: "QLD", lat: -27.5063, lng: 153.1017, pop: 16000 },
  { name: "Mount Gravatt", postcode: "4122", state: "QLD", lat: -27.5458, lng: 153.0800, pop: 10000 },
  { name: "Sunnybank", postcode: "4109", state: "QLD", lat: -27.5784, lng: 153.0613, pop: 18000 },
  { name: "Eight Mile Plains", postcode: "4113", state: "QLD", lat: -27.5789, lng: 153.0996, pop: 10000 },
  // Additional WA
  { name: "Cottesloe", postcode: "6011", state: "WA", lat: -31.9922, lng: 115.7592, pop: 8000 },
  { name: "Claremont", postcode: "6010", state: "WA", lat: -31.9800, lng: 115.7819, pop: 10000 },
  { name: "Midland", postcode: "6056", state: "WA", lat: -31.8856, lng: 116.0077, pop: 5000 },
  { name: "Armadale", postcode: "6112", state: "WA", lat: -32.1520, lng: 116.0147, pop: 35000 },
  { name: "Cannington", postcode: "6107", state: "WA", lat: -32.0167, lng: 115.9333, pop: 6000 },
  { name: "Victoria Park", postcode: "6100", state: "WA", lat: -31.9733, lng: 115.8940, pop: 9000 },
  { name: "Mount Lawley", postcode: "6050", state: "WA", lat: -31.9371, lng: 115.8722, pop: 8000 },
  { name: "Leederville", postcode: "6007", state: "WA", lat: -31.9360, lng: 115.8424, pop: 5000 },
  // More SA
  { name: "Elizabeth", postcode: "5112", state: "SA", lat: -34.7218, lng: 138.6721, pop: 13000 },
  { name: "Salisbury", postcode: "5108", state: "SA", lat: -34.7583, lng: 138.6458, pop: 14000 },
  { name: "Marion", postcode: "5043", state: "SA", lat: -35.0130, lng: 138.5569, pop: 10000 },
  { name: "Tea Tree Gully", postcode: "5091", state: "SA", lat: -34.8233, lng: 138.7333, pop: 4000 },
  { name: "Port Adelaide", postcode: "5015", state: "SA", lat: -34.8453, lng: 138.5017, pop: 4000 },
  { name: "Mitcham", postcode: "5062", state: "SA", lat: -35.0046, lng: 138.6178, pop: 6000 },
];

const BANK_DATA = [
  { name: "Commonwealth Bank", slug: "commonwealth-bank", type: "big4", website: "https://www.commbank.com.au" },
  { name: "Westpac", slug: "westpac", type: "big4", website: "https://www.westpac.com.au" },
  { name: "ANZ", slug: "anz", type: "big4", website: "https://www.anz.com.au" },
  { name: "NAB", slug: "nab", type: "big4", website: "https://www.nab.com.au" },
  { name: "Bendigo Bank", slug: "bendigo-bank", type: "regional", website: "https://www.bendigobank.com.au" },
  { name: "Bank of Queensland", slug: "bank-of-queensland", type: "regional", website: "https://www.boq.com.au" },
  { name: "Suncorp", slug: "suncorp", type: "regional", website: "https://www.suncorp.com.au" },
  { name: "ING", slug: "ing", type: "digital", website: "https://www.ing.com.au" },
  { name: "Macquarie Bank", slug: "macquarie-bank", type: "regional", website: "https://www.macquarie.com.au" },
  { name: "Heritage Bank", slug: "heritage-bank", type: "credit_union", website: "https://www.heritage.com.au" },
  { name: "Greater Bank", slug: "greater-bank", type: "credit_union", website: "https://www.greater.com.au" },
  { name: "Bank Australia", slug: "bank-australia", type: "credit_union", website: "https://www.bankaust.com.au" },
  { name: "ME Bank", slug: "me-bank", type: "digital", website: "https://www.mebank.com.au" },
  { name: "Ubank", slug: "ubank", type: "digital", website: "https://www.ubank.com.au" },
  { name: "Up Bank", slug: "up-bank", type: "digital", website: "https://up.com.au" },
];

const OPENING_HOURS = JSON.stringify({
  mon: "9:30am - 4:00pm",
  tue: "9:30am - 4:00pm",
  wed: "9:30am - 4:00pm",
  thu: "9:30am - 5:00pm",
  fri: "9:30am - 5:00pm",
  sat: "Closed",
  sun: "Closed",
});

const OPENING_HOURS_SAT = JSON.stringify({
  mon: "9:30am - 4:00pm",
  tue: "9:30am - 4:00pm",
  wed: "9:30am - 4:00pm",
  thu: "9:30am - 5:00pm",
  fri: "9:30am - 5:00pm",
  sat: "9:00am - 12:00pm",
  sun: "Closed",
});

const BSB_PREFIXES: Record<string, string> = {
  "Commonwealth Bank": "06",
  "Westpac": "03",
  "ANZ": "01",
  "NAB": "08",
  "Bendigo Bank": "63",
  "Bank of Queensland": "12",
  "Suncorp": "48",
  "Macquarie Bank": "18",
  "Heritage Bank": "63",
  "Greater Bank": "63",
};

const FEE_RATINGS: Record<string, string> = {
  "Commonwealth Bank": "high",
  "Westpac": "high",
  "ANZ": "medium",
  "NAB": "medium",
  "Bendigo Bank": "low",
  "Bank of Queensland": "medium",
  "Suncorp": "medium",
  "ING": "none",
  "Macquarie Bank": "low",
  "Ubank": "none",
  "Up Bank": "none",
  "ME Bank": "none",
  "Heritage Bank": "low",
  "Greater Bank": "low",
  "Bank Australia": "low",
};

function randomFloat(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(branches);
  await db.delete(suburbs);
  await db.delete(banks);

  // Insert banks
  const bankIds: Record<string, number> = {};
  for (const bank of BANK_DATA) {
    const result = await db.insert(banks).values(bank).returning({ id: banks.id });
    bankIds[bank.name] = result[0].id;
  }
  console.log(`Inserted ${BANK_DATA.length} banks`);

  // Insert suburbs and branches
  let totalBranches = 0;
  for (const s of SUBURB_DATA) {
    const suburbSlug = slugify(s.name) + "-" + s.postcode;
    
    // Determine branch density based on population
    const isMetro = s.pop > 20000;
    const isRegional = s.pop > 10000;
    const isRemote = s.pop <= 5000;

    // How many big4 branches exist (higher pop = more)
    const big4BranchCount = isMetro ? 4 : isRegional ? Math.floor(Math.random() * 3) + 2 : isRemote ? Math.floor(Math.random() * 2) : 1;
    
    // How many have closed
    const closedCount = isRemote ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 2);
    
    // ATM count
    const atmCount = isMetro ? Math.floor(Math.random() * 4) + 3 : isRegional ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
    const closedAtms = Math.floor(Math.random() * 2);

    const openBranches = Math.max(big4BranchCount - closedCount, 0);

    const subResult = await db.insert(suburbs).values({
      name: s.name,
      slug: suburbSlug,
      postcode: s.postcode,
      state: s.state,
      stateSlug: STATES[s.state],
      lat: s.lat,
      lng: s.lng,
      branchCount: openBranches,
      atmCount: Math.max(atmCount - closedAtms, 0),
      closedBranches: closedCount,
      closedAtms: closedAtms,
      population: s.pop,
    }).returning({ id: suburbs.id });

    const suburbId = subResult[0].id;

    // Generate branches for this suburb
    const big4Banks = ["Commonwealth Bank", "Westpac", "ANZ", "NAB"];
    const regionalBanks = ["Bendigo Bank", "Bank of Queensland", "Suncorp", "Macquarie Bank"];
    
    const assignedBanks: string[] = [];
    // Always assign some big4
    const shuffledBig4 = big4Banks.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(big4BranchCount, 4); i++) {
      assignedBanks.push(shuffledBig4[i]);
    }
    // Maybe add a regional
    if (isRegional && Math.random() > 0.4) {
      assignedBanks.push(regionalBanks[Math.floor(Math.random() * regionalBanks.length)]);
    }

    let closedSoFar = 0;
    for (let i = 0; i < assignedBanks.length; i++) {
      const bankName = assignedBanks[i];
      const isClosed = closedSoFar < closedCount && (isRemote || Math.random() > 0.6);
      if (isClosed) closedSoFar++;

      const dist = randomFloat(0.3, 3.5);
      const bsbPrefix = BSB_PREFIXES[bankName] || "99";
      const bsb = `${bsbPrefix}${Math.floor(Math.random() * 9000 + 1000).toString().slice(0,4)}`;

      const closedYear = 2024 + Math.floor(Math.random() * 2);
      const closedMonth = ["Jan", "Mar", "Jun", "Sep", "Dec"][Math.floor(Math.random() * 5)];

      await db.insert(branches).values({
        bankId: bankIds[bankName],
        suburbId,
        name: `${bankName} ${s.name}`,
        address: `${Math.floor(Math.random() * 300 + 1)} ${["High St", "Main St", "Station Rd", "George St", "Queen St", "King St", "Church St", "Park Ave", "Railway Pde"][Math.floor(Math.random() * 9)]}, ${s.name} ${s.state} ${s.postcode}`,
        postcode: s.postcode,
        lat: s.lat + (Math.random() - 0.5) * 0.01,
        lng: s.lng + (Math.random() - 0.5) * 0.01,
        type: "branch",
        status: isClosed ? "closed" : "open",
        bsb: `${bsb.slice(0,3)}-${bsb.slice(3)}`,
        openingHours: Math.random() > 0.7 ? OPENING_HOURS_SAT : OPENING_HOURS,
        closedDate: isClosed ? `${closedMonth} ${closedYear}` : null,
        distanceKm: dist,
        feeRating: FEE_RATINGS[bankName] || "medium",
      });
      totalBranches++;
    }

    // Add ATMs
    const atmBanks = shuffledBig4.slice(0, Math.min(atmCount, 4));
    for (let i = 0; i < atmBanks.length; i++) {
      const bankName = atmBanks[i];
      const isAtmClosed = i < closedAtms;
      await db.insert(branches).values({
        bankId: bankIds[bankName],
        suburbId,
        name: `${bankName} ATM - ${s.name}`,
        address: `${["Woolworths", "Coles", "7-Eleven", "Shell", "Shopping Centre"][Math.floor(Math.random() * 5)]}, ${s.name} ${s.state} ${s.postcode}`,
        postcode: s.postcode,
        lat: s.lat + (Math.random() - 0.5) * 0.015,
        lng: s.lng + (Math.random() - 0.5) * 0.015,
        type: "atm",
        status: isAtmClosed ? "closed" : "open",
        bsb: null,
        openingHours: null,
        closedDate: isAtmClosed ? "2025" : null,
        distanceKm: randomFloat(0.1, 2.0),
        feeRating: Math.random() > 0.5 ? "none" : "low",
      });
      totalBranches++;
    }
  }

  console.log(`Inserted ${SUBURB_DATA.length} suburbs`);
  console.log(`Inserted ${totalBranches} branches/ATMs`);
  console.log("Seed complete!");
}

seed().catch(console.error);
