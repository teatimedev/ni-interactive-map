// TypeScript interfaces for NI Interactive Map data structures

export interface PartyResult {
  party: string;
  approx_vote_share: number;
}

export interface Assembly2022 {
  note?: string;
  top_parties: PartyResult[];
}

export interface Demographics {
  population_2011: number;
  population_change_pct: number;
  catholic_pct: number;
  protestant_other_christian_pct: number;
  other_religion_pct: number;
  no_religion_pct: number;
  born_ni_pct: number;
  born_rest_uk_pct: number;
  born_ireland_pct: number;
  born_eu_pct: number;
  born_rest_world_pct: number;
  irish_speakers_pct: number;
  ulster_scots_speakers_pct: number;
  urban_rural?: string;
}

export interface Housing {
  median_house_price: number;
  avg_house_price: number;
  price_year?: string;
  owner_occupied_pct: number;
  private_rented_pct: number;
  social_housing_pct: number;
}

export interface Health {
  very_good_pct: number;
  good_pct: number;
  fair_pct: number;
  bad_pct: number;
  very_bad_pct: number;
  disability_limited_lot_pct: number;
  disability_limited_little_pct: number;
  unpaid_care_pct: number;
}

export interface Crime {
  total_recorded: number;
  rate_per_1000: number;
  period?: string;
  violence?: number;
  sexual_offences?: number;
  robbery?: number;
  theft?: number;
  criminal_damage?: number;
  burglary?: number;
  drugs?: number;
  public_order?: number;
  possession_weapons?: number;
  miscellaneous?: number;
  antisocial_behaviour?: number;
}

export interface Education {
  degree_plus_pct: number;
  a_level_pct: number;
  gcse_pct: number;
  other_pct?: number;
  no_qualifications_pct: number;
}

export interface Transport {
  no_car_pct: number;
  one_car_pct: number;
  two_plus_cars_pct: number;
  drive_pct?: number;
  public_transport_pct?: number;
  walk_cycle_pct?: number;
  work_from_home_pct?: number;
  other_pct?: number;
  full_fibre_pct?: number;
  avg_broadband_mbps?: number;
}

export interface District {
  slug: string;
  name: string;
  population: number;
  area_sq_km: number;
  population_density_per_sq_km: number;
  age_0_15_pct: number;
  age_16_64_pct: number;
  age_65_plus_pct: number;
  median_annual_earnings_residence: number;
  employment_rate_pct: number;
  unemployment_rate_census_pct: number;
  claimant_count_rate_pct: number;
  life_expectancy_male: number;
  life_expectancy_female: number;
  long_term_health_condition_pct: number;
  nimdm_soas_in_top100: number;
  nimdm_total_soas: number;
  nimdm_pct_in_top100: number;
  assembly_2022: Assembly2022;
  demographics: Demographics;
  housing: Housing;
  health: Health;
  crime: Crime;
  education: Education;
  transport: Transport;
}

export interface Ward {
  slug: string;
  name: string;
  population: number;
  male: number;
  female: number;
  age_0_15_pct: number;
  age_16_64_pct: number;
  age_65_plus_pct: number;
  catholic_pct: number;
  protestant_other_christian_pct: number;
  other_religion_pct: number;
  no_religion_pct: number;
  born_ni_pct: number;
  born_other_uk_pct: number;
  born_roi_pct: number;
  born_elsewhere_pct: number;
  owner_occupied_pct: number;
  social_rented_pct: number;
  private_rented_pct: number;
  no_qualifications_pct: number;
  level_1_2_pct: number;
  level_3_pct: number;
  level_4_plus_pct: number;
  very_good_good_health_pct: number;
  fair_health_pct: number;
  bad_very_bad_health_pct: number;
  no_cars_pct: number;
  one_car_pct: number;
  two_plus_cars_pct: number;
  work_from_home_pct: number;
  drive_to_work_pct: number;
  public_transport_pct: number;
  walk_cycle_pct: number;
  urban_rural?: string;
  // Census 2011 baselines (for trend comparison)
  population_2011?: number;
  no_qualifications_2011_pct?: number;
  level_4_plus_2011_pct?: number;
  bad_very_bad_health_2011_pct?: number;
  owner_occupied_2011_pct?: number;
  no_cars_2011_pct?: number;
  // Benefits (DfC quarterly statistics)
  benefits_claimant_pct?: number;
  deprivation_rank: number;
  income_rank: number;
  employment_rank: number;
  health_rank: number;
  education_rank: number;
  access_rank: number;
  living_env_rank: number;
  crime_rank: number;
  // Crime data (data.police.uk, 12-month rolling)
  crime_total?: number;
  crime_rate_per_1000?: number;
  crime_asb?: number;
  crime_violent?: number;
  crime_burglary?: number;
  crime_criminal_damage?: number;
  crime_drugs?: number;
  crime_theft?: number;
  crime_vehicle?: number;
  crime_public_order?: number;
  crime_robbery?: number;
  crime_weapons?: number;
  crime_other?: number;
  crime_period?: string; // e.g. "Jul 2024 – Jun 2025"
}

export interface WardWithGeometry extends Ward {
  geometry: GeoJSON.Geometry;
}

export interface WardDataFile {
  lgd: string;
  wards: Ward[];
}

export interface NIOverall {
  total_population: number;
  total_area_sq_km: number;
  population_density_per_sq_km: number;
  life_expectancy_male: number;
  life_expectancy_female: number;
  median_annual_earnings_residence: number;
  employment_rate_pct: number;
  unemployment_rate_census_pct: number;
  total_recorded_crime_2024_25: number;
  crime_rate_per_1000: number;
}

export type ChoroplethMetric =
  | "population_density"
  | "deprivation"
  | "median_income"
  | "house_price"
  | "crime_rate"
  | "degree_pct"
  | "no_car_pct"
  | "catholic_pct"
  | "protestant_pct"
  | "livability";

export interface ChoroplethConfig {
  key: string;
  wardKey: string | null;
  min: number;
  max: number;
  wardMin?: number;
  wardMax?: number;
  color: [number, number, number];
  label: string;
}

export type MapView = "districts" | "district-detail" | "ward-detail";
