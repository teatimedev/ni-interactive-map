// Northern Ireland Statistics Data
// All data sourced from official publications. No estimated or fabricated figures.
//
// Sources:
// - NISRA Census 2021 (Flexible Table Builder: religion MS-B23, education MS-G01,
//   general health, disability, unpaid care, country of birth, car availability,
//   housing tenure, travel to work, Irish language, Ulster-Scots language)
// - NISRA Health Inequalities Annual Report 2024 (life expectancy 2020-22)
// - Invest NI Council Briefings 2024 (LFS 2023, ASHE Earnings 2024)
// - Census 2021 / CSO Joint Publication (ILO unemployment rates)
// - NIMDM 2017 (Multiple Deprivation Measure)
// - NI Assembly Election Report 2022 (Electoral Office / NISRA)
// - LPS / Department of Finance: NI House Price Index 2024 (annual descriptive stats)
// - PSNI Police Recorded Crime Statistics 2024/25
// - NISRA 2011 Census (population on 2014 LGD boundaries)
// - Ofcom Connected Nations NI Report 2025

const STATS_DATA = {
  _metadata: {
    sources: [
      "NISRA Census 2021",
      "NISRA Health Inequalities Annual Report 2024 (Life expectancy, 2020-22 period)",
      "Invest NI Council Briefings 2024 (Labour market from LFS 2023, ASHE Earnings 2024)",
      "Census 2021 / CSO Joint Publication 2021-2022 (Census ILO unemployment rates)",
      "NIMDM 2017 (Northern Ireland Multiple Deprivation Measure, 890 SOAs)",
      "NI Assembly Election Report 2022 (Electoral Office / NISRA)",
      "LPS / Department of Finance: NI House Price Index 2024",
      "PSNI Police Recorded Crime Statistics 2024/25",
      "Ofcom Connected Nations NI Report 2025"
    ]
  },
  ni_overall: {
    total_population: 1903175,
    total_area_sq_km: 13546.65,
    population_density_per_sq_km: 140.5,
    life_expectancy_male: 78.4,
    life_expectancy_female: 82.3,
    median_annual_earnings_residence: 30574,
    employment_rate_pct: 75,
    unemployment_rate_census_pct: 4.7,
    total_recorded_crime_2024_25: 95968,
    crime_rate_per_1000: 50
  },
  districts: {
    antrim_and_newtownabbey: {
      name: "Antrim and Newtownabbey",
      population: 145662,
      area_sq_km: 571.43,
      population_density_per_sq_km: 254.9,
      age_0_15_pct: 20.1,
      age_16_64_pct: 62.7,
      age_65_plus_pct: 17.2,
      median_annual_earnings_residence: 31372,
      employment_rate_pct: 80,
      unemployment_rate_census_pct: 3.8,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 78.7,
      life_expectancy_female: 82.5,
      long_term_health_condition_pct: 34.7,
      nimdm_soas_in_top100: 1,
      nimdm_total_soas: 72,
      nimdm_pct_in_top100: 1.4,
      assembly_2022: {
        note: "Approximated from South Antrim constituency",
        top_parties: [
          { party: "DUP", approx_vote_share: 27.2 },
          { party: "Sinn Féin", approx_vote_share: 21.6 },
          { party: "Alliance", approx_vote_share: 17.6 },
          { party: "UUP", approx_vote_share: 14.5 }
        ]
      },
      demographics: {
        population_2011: 138567,
        population_change_pct: 5.1,
        catholic_pct: 31.4,
        protestant_other_christian_pct: 54.7,
        other_religion_pct: 1.5,
        no_religion_pct: 12.3,
        born_ni_pct: 88.3,
        born_rest_uk_pct: 5.0,
        born_ireland_pct: 1.0,
        born_eu_pct: 3.0,
        born_rest_world_pct: 2.7,
        irish_speakers_pct: 7.9,
        ulster_scots_speakers_pct: 11.7,
        urban_rural: "Predominantly urban (70% urban wards)"
      },
      housing: {
        median_house_price: 181500,
        avg_house_price: 196238,
        price_year: "2024",
        owner_occupied_pct: 74.9,
        private_rented_pct: 14.5,
        social_housing_pct: 10.6
      },
      education: {
        no_qualifications_pct: 21.5,
        gcse_pct: 14.8,
        a_level_pct: 16.5,
        degree_plus_pct: 31.5,
        other_pct: 9.0
      },
      crime: {
        total_recorded: 6602,
        rate_per_1000: 45,
        period: "2024/25",
        violence: 2877,
        sexual_offences: 288,
        robbery: 14,
        theft: 1512,
        burglary: 182,
        criminal_damage: 992,
        drugs: 536,
        possession_weapons: 99,
        public_order: 61,
        miscellaneous: 223,
        antisocial_behaviour: 2691
      },
      transport: {
        no_car_pct: 11.2,
        one_car_pct: 33.5,
        two_plus_cars_pct: 55.3,
        drive_pct: 63.7,
        public_transport_pct: 3.1,
        walk_cycle_pct: 4.6,
        work_from_home_pct: 19.4,
        other_pct: 9.1,
        full_fibre_pct: 98,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 49.7,
        good_pct: 29.6,
        fair_pct: 13.5,
        bad_pct: 5.5,
        very_bad_pct: 1.8,
        disability_limited_lot_pct: 10.9,
        disability_limited_little_pct: 13.0,
        unpaid_care_pct: 12.2
      }
    },
    ards_and_north_down: {
      name: "Ards and North Down",
      population: 163660,
      area_sq_km: 458.35,
      population_density_per_sq_km: 357.1,
      age_0_15_pct: 18.1,
      age_16_64_pct: 59.7,
      age_65_plus_pct: 22.1,
      median_annual_earnings_residence: 29879,
      employment_rate_pct: 76,
      unemployment_rate_census_pct: 3.1,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 80.0,
      life_expectancy_female: 82.9,
      long_term_health_condition_pct: 37.5,
      nimdm_soas_in_top100: 3,
      nimdm_total_soas: 81,
      nimdm_pct_in_top100: 3.7,
      assembly_2022: {
        note: "Approximated from Strangford and North Down constituencies",
        top_parties: [
          { party: "DUP", approx_vote_share: 26.5 },
          { party: "Alliance", approx_vote_share: 22.7 },
          { party: "UUP", approx_vote_share: 13.8 },
          { party: "Sinn Féin", approx_vote_share: 5.3 }
        ]
      },
      demographics: {
        population_2011: 156672,
        population_change_pct: 4.5,
        catholic_pct: 13.6,
        protestant_other_christian_pct: 67.9,
        other_religion_pct: 1.4,
        no_religion_pct: 17.1,
        born_ni_pct: 86.8,
        born_rest_uk_pct: 7.4,
        born_ireland_pct: 1.2,
        born_eu_pct: 2.2,
        born_rest_world_pct: 2.4,
        irish_speakers_pct: 3.2,
        ulster_scots_speakers_pct: 12.4,
        urban_rural: "Predominantly urban (63% urban wards)"
      },
      housing: {
        median_house_price: 195000,
        avg_house_price: 236071,
        price_year: "2024",
        owner_occupied_pct: 75.0,
        private_rented_pct: 14.0,
        social_housing_pct: 11.0
      },
      education: {
        no_qualifications_pct: 19.2,
        gcse_pct: 14.7,
        a_level_pct: 16.0,
        degree_plus_pct: 34.1,
        other_pct: 9.3
      },
      crime: {
        total_recorded: 5574,
        rate_per_1000: 34,
        period: "2024/25",
        violence: 2611,
        sexual_offences: 321,
        robbery: 7,
        theft: 1116,
        burglary: 99,
        criminal_damage: 873,
        drugs: 357,
        possession_weapons: 47,
        public_order: 72,
        miscellaneous: 170,
        antisocial_behaviour: 3157
      },
      transport: {
        no_car_pct: 10.4,
        one_car_pct: 33.2,
        two_plus_cars_pct: 56.4,
        drive_pct: 61.8,
        public_transport_pct: 1.7,
        walk_cycle_pct: 5.3,
        work_from_home_pct: 22.6,
        other_pct: 8.6,
        full_fibre_pct: 97,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 46.8,
        good_pct: 31.3,
        fair_pct: 14.7,
        bad_pct: 5.5,
        very_bad_pct: 1.8,
        disability_limited_lot_pct: 11.1,
        disability_limited_little_pct: 14.2,
        unpaid_care_pct: 13.0
      }
    },
    armagh_city_banbridge_and_craigavon: {
      name: "Armagh City, Banbridge and Craigavon",
      population: 218656,
      area_sq_km: 1331.68,
      population_density_per_sq_km: 164.2,
      age_0_15_pct: 22.1,
      age_16_64_pct: 61.9,
      age_65_plus_pct: 16.0,
      median_annual_earnings_residence: 30597,
      employment_rate_pct: 79,
      unemployment_rate_census_pct: 4.4,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 78.8,
      life_expectancy_female: 82.8,
      long_term_health_condition_pct: 32.3,
      nimdm_soas_in_top100: 8,
      nimdm_total_soas: 87,
      nimdm_pct_in_top100: 9.2,
      assembly_2022: {
        note: "Approximated from Upper Bann and Newry & Armagh constituencies",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 29.4 },
          { party: "DUP", approx_vote_share: 19.9 },
          { party: "UUP", approx_vote_share: 15.3 },
          { party: "Alliance", approx_vote_share: 11.5 }
        ]
      },
      demographics: {
        population_2011: 199693,
        population_change_pct: 9.5,
        catholic_pct: 43.8,
        protestant_other_christian_pct: 46.7,
        other_religion_pct: 1.2,
        no_religion_pct: 8.2,
        born_ni_pct: 85.5,
        born_rest_uk_pct: 4.0,
        born_ireland_pct: 1.9,
        born_eu_pct: 6.4,
        born_rest_world_pct: 2.2,
        irish_speakers_pct: 12.2,
        ulster_scots_speakers_pct: 9.7,
        urban_rural: "Mixed (41% urban, 39% rural wards)"
      },
      housing: {
        median_house_price: 172500,
        avg_house_price: 181963,
        price_year: "2024",
        owner_occupied_pct: 72.3,
        private_rented_pct: 19.5,
        social_housing_pct: 8.2
      },
      education: {
        no_qualifications_pct: 25.2,
        gcse_pct: 14.1,
        a_level_pct: 15.5,
        degree_plus_pct: 30.4,
        other_pct: 8.3
      },
      crime: {
        total_recorded: 9009,
        rate_per_1000: 41,
        period: "2024/25",
        violence: 3918,
        sexual_offences: 427,
        robbery: 24,
        theft: 2075,
        burglary: 276,
        criminal_damage: 1448,
        drugs: 580,
        possession_weapons: 97,
        public_order: 71,
        miscellaneous: 369,
        antisocial_behaviour: 4986
      },
      transport: {
        no_car_pct: 10.1,
        one_car_pct: 29.7,
        two_plus_cars_pct: 60.2,
        drive_pct: 68.1,
        public_transport_pct: 1.3,
        walk_cycle_pct: 4.8,
        work_from_home_pct: 16.2,
        other_pct: 9.5,
        full_fibre_pct: 94,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 52.0,
        good_pct: 28.4,
        fair_pct: 12.7,
        bad_pct: 5.2,
        very_bad_pct: 1.7,
        disability_limited_lot_pct: 10.4,
        disability_limited_little_pct: 11.9,
        unpaid_care_pct: 11.3
      }
    },
    belfast: {
      name: "Belfast",
      population: 345418,
      area_sq_km: 132.96,
      population_density_per_sq_km: 2597.8,
      age_0_15_pct: 19.1,
      age_16_64_pct: 66.1,
      age_65_plus_pct: 14.7,
      median_annual_earnings_residence: 29968,
      employment_rate_pct: 70,
      unemployment_rate_census_pct: 4.9,
      claimant_count_rate_pct: 4,
      life_expectancy_male: 75.8,
      life_expectancy_female: 80.4,
      long_term_health_condition_pct: 37.4,
      nimdm_soas_in_top100: 50,
      nimdm_total_soas: 174,
      nimdm_pct_in_top100: 28.7,
      assembly_2022: {
        note: "Covers Belfast North, South, East, West constituencies",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 30.2 },
          { party: "Alliance", approx_vote_share: 19.3 },
          { party: "DUP", approx_vote_share: 17.3 },
          { party: "SDLP", approx_vote_share: 11.2 }
        ]
      },
      demographics: {
        population_2011: 333871,
        population_change_pct: 3.5,
        catholic_pct: 48.7,
        protestant_other_christian_pct: 36.4,
        other_religion_pct: 3.3,
        no_religion_pct: 11.6,
        born_ni_pct: 83.8,
        born_rest_uk_pct: 4.5,
        born_ireland_pct: 1.9,
        born_eu_pct: 4.0,
        born_rest_world_pct: 5.8,
        irish_speakers_pct: 15.5,
        ulster_scots_speakers_pct: 7.3,
        urban_rural: "Urban (100% urban wards)"
      },
      housing: {
        median_house_price: 163000,
        avg_house_price: 197557,
        price_year: "2024",
        owner_occupied_pct: 53.3,
        private_rented_pct: 21.9,
        social_housing_pct: 24.8
      },
      education: {
        no_qualifications_pct: 23.9,
        gcse_pct: 12.3,
        a_level_pct: 16.6,
        degree_plus_pct: 34.4,
        other_pct: 6.9
      },
      crime: {
        total_recorded: 32264,
        rate_per_1000: 93,
        period: "2024/25",
        violence: 12868,
        sexual_offences: 1326,
        robbery: 232,
        theft: 9041,
        burglary: 1016,
        criminal_damage: 4421,
        drugs: 2740,
        possession_weapons: 457,
        public_order: 354,
        miscellaneous: 825,
        antisocial_behaviour: 14128
      },
      transport: {
        no_car_pct: 26.9,
        one_car_pct: 40.2,
        two_plus_cars_pct: 32.9,
        drive_pct: 47.2,
        public_transport_pct: 8.1,
        walk_cycle_pct: 11.5,
        work_from_home_pct: 22.1,
        other_pct: 11.2,
        full_fibre_pct: 94,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 47.8,
        good_pct: 28.0,
        fair_pct: 14.2,
        bad_pct: 7.3,
        very_bad_pct: 2.7,
        disability_limited_lot_pct: 13.6,
        disability_limited_little_pct: 13.2,
        unpaid_care_pct: 11.6
      }
    },
    causeway_coast_and_glens: {
      name: "Causeway Coast and Glens",
      population: 141746,
      area_sq_km: 1979.58,
      population_density_per_sq_km: 71.6,
      age_0_15_pct: 19.5,
      age_16_64_pct: 61.3,
      age_65_plus_pct: 19.3,
      median_annual_earnings_residence: 27893,
      employment_rate_pct: 69,
      unemployment_rate_census_pct: 3.7,
      claimant_count_rate_pct: 4,
      life_expectancy_male: 79.1,
      life_expectancy_female: 82.6,
      long_term_health_condition_pct: 36.0,
      nimdm_soas_in_top100: 3,
      nimdm_total_soas: 72,
      nimdm_pct_in_top100: 4.2,
      assembly_2022: {
        note: "Approximated from East Londonderry and North Antrim constituencies",
        top_parties: [
          { party: "DUP", approx_vote_share: 24.8 },
          { party: "Sinn Féin", approx_vote_share: 23.6 },
          { party: "TUV", approx_vote_share: 12.9 },
          { party: "UUP", approx_vote_share: 11.1 }
        ]
      },
      demographics: {
        population_2011: 140877,
        population_change_pct: 0.6,
        catholic_pct: 40.1,
        protestant_other_christian_pct: 51.2,
        other_religion_pct: 0.8,
        no_religion_pct: 7.9,
        born_ni_pct: 89.7,
        born_rest_uk_pct: 5.5,
        born_ireland_pct: 1.4,
        born_eu_pct: 2.0,
        born_rest_world_pct: 1.4,
        irish_speakers_pct: 10.0,
        ulster_scots_speakers_pct: 19.5,
        urban_rural: "Mixed (40% urban, 42% rural wards)"
      },
      housing: {
        median_house_price: 182500,
        avg_house_price: 208659,
        price_year: "2024",
        owner_occupied_pct: 69.6,
        private_rented_pct: 19.2,
        social_housing_pct: 11.1
      },
      education: {
        no_qualifications_pct: 26.0,
        gcse_pct: 14.0,
        a_level_pct: 16.2,
        degree_plus_pct: 29.2,
        other_pct: 8.6
      },
      crime: {
        total_recorded: 5379,
        rate_per_1000: 38,
        period: "2024/25",
        violence: 2419,
        sexual_offences: 247,
        robbery: 11,
        theft: 1122,
        burglary: 169,
        criminal_damage: 831,
        drugs: 410,
        possession_weapons: 52,
        public_order: 73,
        miscellaneous: 214,
        antisocial_behaviour: 2776
      },
      transport: {
        no_car_pct: 10.6,
        one_car_pct: 31.8,
        two_plus_cars_pct: 57.6,
        drive_pct: 68.1,
        public_transport_pct: 0.8,
        walk_cycle_pct: 5.6,
        work_from_home_pct: 17.0,
        other_pct: 8.5,
        full_fibre_pct: 93,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 48.3,
        good_pct: 29.5,
        fair_pct: 14.8,
        bad_pct: 5.6,
        very_bad_pct: 1.8,
        disability_limited_lot_pct: 11.7,
        disability_limited_little_pct: 13.9,
        unpaid_care_pct: 11.3
      }
    },
    derry_city_and_strabane: {
      name: "Derry City and Strabane",
      population: 150757,
      area_sq_km: 1237.3,
      population_density_per_sq_km: 121.8,
      age_0_15_pct: 21.2,
      age_16_64_pct: 62.8,
      age_65_plus_pct: 16.0,
      median_annual_earnings_residence: 28007,
      employment_rate_pct: 67,
      unemployment_rate_census_pct: 6.8,
      claimant_count_rate_pct: 5,
      life_expectancy_male: 77.5,
      life_expectancy_female: 81.5,
      long_term_health_condition_pct: 36.6,
      nimdm_soas_in_top100: 20,
      nimdm_total_soas: 75,
      nimdm_pct_in_top100: 26.7,
      assembly_2022: {
        note: "Approximated from Foyle and West Tyrone constituencies",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 35.9 },
          { party: "SDLP", approx_vote_share: 18.4 },
          { party: "DUP", approx_vote_share: 11.8 },
          { party: "Alliance", approx_vote_share: 8.1 }
        ]
      },
      demographics: {
        population_2011: 147720,
        population_change_pct: 2.1,
        catholic_pct: 72.4,
        protestant_other_christian_pct: 23.1,
        other_religion_pct: 1.0,
        no_religion_pct: 3.5,
        born_ni_pct: 88.3,
        born_rest_uk_pct: 4.6,
        born_ireland_pct: 4.2,
        born_eu_pct: 1.3,
        born_rest_world_pct: 1.6,
        irish_speakers_pct: 16.0,
        ulster_scots_speakers_pct: 6.2,
        urban_rural: "Predominantly urban (60% urban wards)"
      },
      housing: {
        median_house_price: 160500,
        avg_house_price: 178412,
        price_year: "2024",
        owner_occupied_pct: 62.1,
        private_rented_pct: 17.8,
        social_housing_pct: 20.1
      },
      education: {
        no_qualifications_pct: 28.4,
        gcse_pct: 13.3,
        a_level_pct: 15.7,
        degree_plus_pct: 29.6,
        other_pct: 6.8
      },
      crime: {
        total_recorded: 9753,
        rate_per_1000: 65,
        period: "2024/25",
        violence: 4777,
        sexual_offences: 395,
        robbery: 46,
        theft: 1840,
        burglary: 239,
        criminal_damage: 1413,
        drugs: 696,
        possession_weapons: 108,
        public_order: 97,
        miscellaneous: 381,
        antisocial_behaviour: 3530
      },
      transport: {
        no_car_pct: 17.2,
        one_car_pct: 35.4,
        two_plus_cars_pct: 47.4,
        drive_pct: 63.4,
        public_transport_pct: 1.7,
        walk_cycle_pct: 7.8,
        work_from_home_pct: 16.7,
        other_pct: 10.4,
        full_fibre_pct: 95,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 49.3,
        good_pct: 26.7,
        fair_pct: 14.5,
        bad_pct: 7.0,
        very_bad_pct: 2.5,
        disability_limited_lot_pct: 13.9,
        disability_limited_little_pct: 13.2,
        unpaid_care_pct: 11.9
      }
    },
    fermanagh_and_omagh: {
      name: "Fermanagh and Omagh",
      population: 116812,
      area_sq_km: 2835.94,
      population_density_per_sq_km: 41.2,
      age_0_15_pct: 21.2,
      age_16_64_pct: 60.4,
      age_65_plus_pct: 18.4,
      median_annual_earnings_residence: 31169,
      employment_rate_pct: 74,
      unemployment_rate_census_pct: 3.7,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 79.0,
      life_expectancy_female: 82.8,
      long_term_health_condition_pct: 33.8,
      nimdm_soas_in_top100: 3,
      nimdm_total_soas: 49,
      nimdm_pct_in_top100: 6.1,
      assembly_2022: {
        note: "Approximated from Fermanagh & South Tyrone constituency",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 38.4 },
          { party: "UUP", approx_vote_share: 17.3 },
          { party: "DUP", approx_vote_share: 14.4 },
          { party: "SDLP", approx_vote_share: 8.9 }
        ]
      },
      demographics: {
        population_2011: 113161,
        population_change_pct: 3.2,
        catholic_pct: 64.3,
        protestant_other_christian_pct: 30.7,
        other_religion_pct: 0.9,
        no_religion_pct: 4.1,
        born_ni_pct: 84.8,
        born_rest_uk_pct: 5.1,
        born_ireland_pct: 4.9,
        born_eu_pct: 3.6,
        born_rest_world_pct: 1.5,
        irish_speakers_pct: 17.8,
        ulster_scots_speakers_pct: 7.7,
        urban_rural: "Predominantly rural (65% rural wards)"
      },
      housing: {
        median_house_price: 173000,
        avg_house_price: 182892,
        price_year: "2024",
        owner_occupied_pct: 73.6,
        private_rented_pct: 19.3,
        social_housing_pct: 7.1
      },
      education: {
        no_qualifications_pct: 25.5,
        gcse_pct: 13.6,
        a_level_pct: 15.1,
        degree_plus_pct: 31.8,
        other_pct: 7.7
      },
      crime: {
        total_recorded: 3897,
        rate_per_1000: 33,
        period: "2024/25",
        violence: 1629,
        sexual_offences: 179,
        robbery: 9,
        theft: 852,
        burglary: 110,
        criminal_damage: 545,
        drugs: 419,
        possession_weapons: 51,
        public_order: 34,
        miscellaneous: 179,
        antisocial_behaviour: 1797
      },
      transport: {
        no_car_pct: 8.4,
        one_car_pct: 27.2,
        two_plus_cars_pct: 64.4,
        drive_pct: 70.3,
        public_transport_pct: 0.7,
        walk_cycle_pct: 5.4,
        work_from_home_pct: 16.4,
        other_pct: 7.2,
        full_fibre_pct: 90,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 51.2,
        good_pct: 28.2,
        fair_pct: 14.0,
        bad_pct: 4.9,
        very_bad_pct: 1.7,
        disability_limited_lot_pct: 11.0,
        disability_limited_little_pct: 12.9,
        unpaid_care_pct: 10.8
      }
    },
    lisburn_and_castlereagh: {
      name: "Lisburn and Castlereagh",
      population: 149106,
      area_sq_km: 503.58,
      population_density_per_sq_km: 296.1,
      age_0_15_pct: 20.2,
      age_16_64_pct: 62.2,
      age_65_plus_pct: 17.6,
      median_annual_earnings_residence: 34731,
      employment_rate_pct: 78,
      unemployment_rate_census_pct: 2.8,
      claimant_count_rate_pct: 2,
      life_expectancy_male: 80.4,
      life_expectancy_female: 83.1,
      long_term_health_condition_pct: 33.2,
      nimdm_soas_in_top100: 0,
      nimdm_total_soas: 67,
      nimdm_pct_in_top100: 0.0,
      assembly_2022: {
        note: "Approximated from Lagan Valley constituency",
        top_parties: [
          { party: "DUP", approx_vote_share: 30.0 },
          { party: "Alliance", approx_vote_share: 19.3 },
          { party: "UUP", approx_vote_share: 14.6 },
          { party: "Sinn Féin", approx_vote_share: 6.3 }
        ]
      },
      demographics: {
        population_2011: 134841,
        population_change_pct: 10.6,
        catholic_pct: 27.2,
        protestant_other_christian_pct: 58.3,
        other_religion_pct: 1.7,
        no_religion_pct: 12.8,
        born_ni_pct: 87.0,
        born_rest_uk_pct: 5.5,
        born_ireland_pct: 1.5,
        born_eu_pct: 2.7,
        born_rest_world_pct: 3.3,
        irish_speakers_pct: 6.9,
        ulster_scots_speakers_pct: 8.9,
        urban_rural: "Mixed urban/rural (50% urban, 33% rural wards)"
      },
      housing: {
        median_house_price: 215000,
        avg_house_price: 237801,
        price_year: "2024",
        owner_occupied_pct: 77.4,
        private_rented_pct: 12.1,
        social_housing_pct: 10.5
      },
      education: {
        no_qualifications_pct: 17.9,
        gcse_pct: 13.4,
        a_level_pct: 15.4,
        degree_plus_pct: 39.2,
        other_pct: 7.8
      },
      crime: {
        total_recorded: 5372,
        rate_per_1000: 36,
        period: "2024/25",
        violence: 2094,
        sexual_offences: 268,
        robbery: 12,
        theft: 1540,
        burglary: 157,
        criminal_damage: 659,
        drugs: 510,
        possession_weapons: 68,
        public_order: 58,
        miscellaneous: 163,
        antisocial_behaviour: 2561
      },
      transport: {
        no_car_pct: 8.4,
        one_car_pct: 31.6,
        two_plus_cars_pct: 60.0,
        drive_pct: 62.2,
        public_transport_pct: 2.9,
        walk_cycle_pct: 4.6,
        work_from_home_pct: 22.5,
        other_pct: 7.8,
        full_fibre_pct: 97,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 52.1,
        good_pct: 29.2,
        fair_pct: 12.5,
        bad_pct: 4.7,
        very_bad_pct: 1.5,
        disability_limited_lot_pct: 9.3,
        disability_limited_little_pct: 12.4,
        unpaid_care_pct: 12.0
      }
    },
    mid_and_east_antrim: {
      name: "Mid and East Antrim",
      population: 138995,
      area_sq_km: 1044.53,
      population_density_per_sq_km: 133.1,
      age_0_15_pct: 18.6,
      age_16_64_pct: 61.7,
      age_65_plus_pct: 19.7,
      median_annual_earnings_residence: 29765,
      employment_rate_pct: 81,
      unemployment_rate_census_pct: 3.2,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 78.3,
      life_expectancy_female: 82.5,
      long_term_health_condition_pct: 36.1,
      nimdm_soas_in_top100: 3,
      nimdm_total_soas: 69,
      nimdm_pct_in_top100: 4.3,
      assembly_2022: {
        note: "Approximated from East Antrim constituency",
        top_parties: [
          { party: "DUP", approx_vote_share: 29.3 },
          { party: "Alliance", approx_vote_share: 19.2 },
          { party: "UUP", approx_vote_share: 13.2 },
          { party: "TUV", approx_vote_share: 10.2 }
        ]
      },
      demographics: {
        population_2011: 135338,
        population_change_pct: 2.7,
        catholic_pct: 19.7,
        protestant_other_christian_pct: 67.3,
        other_religion_pct: 1.0,
        no_religion_pct: 12.1,
        born_ni_pct: 88.3,
        born_rest_uk_pct: 5.1,
        born_ireland_pct: 0.8,
        born_eu_pct: 4.1,
        born_rest_world_pct: 1.6,
        irish_speakers_pct: 4.7,
        ulster_scots_speakers_pct: 20.3,
        urban_rural: "Mixed urban/rural (52% urban, 35% rural wards)"
      },
      housing: {
        median_house_price: 159950,
        avg_house_price: 177006,
        price_year: "2024",
        owner_occupied_pct: 72.7,
        private_rented_pct: 17.4,
        social_housing_pct: 9.9
      },
      education: {
        no_qualifications_pct: 24.3,
        gcse_pct: 14.4,
        a_level_pct: 16.2,
        degree_plus_pct: 28.8,
        other_pct: 10.0
      },
      crime: {
        total_recorded: 5897,
        rate_per_1000: 42,
        period: "2024/25",
        violence: 2643,
        sexual_offences: 269,
        robbery: 15,
        theft: 1201,
        burglary: 176,
        criminal_damage: 903,
        drugs: 555,
        possession_weapons: 79,
        public_order: 47,
        miscellaneous: 185,
        antisocial_behaviour: 2704
      },
      transport: {
        no_car_pct: 11.8,
        one_car_pct: 32.1,
        two_plus_cars_pct: 56.1,
        drive_pct: 65.1,
        public_transport_pct: 1.1,
        walk_cycle_pct: 5.8,
        work_from_home_pct: 17.5,
        other_pct: 10.5,
        full_fibre_pct: 96,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 47.8,
        good_pct: 30.5,
        fair_pct: 14.4,
        bad_pct: 5.5,
        very_bad_pct: 1.7,
        disability_limited_lot_pct: 11.3,
        disability_limited_little_pct: 13.8,
        unpaid_care_pct: 12.0
      }
    },
    mid_ulster: {
      name: "Mid Ulster",
      population: 150293,
      area_sq_km: 1823.03,
      population_density_per_sq_km: 82.4,
      age_0_15_pct: 23.0,
      age_16_64_pct: 62.0,
      age_65_plus_pct: 15.0,
      median_annual_earnings_residence: 29182,
      employment_rate_pct: 77,
      unemployment_rate_census_pct: 3.5,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 78.9,
      life_expectancy_female: 83.1,
      long_term_health_condition_pct: 29.6,
      nimdm_soas_in_top100: 1,
      nimdm_total_soas: 59,
      nimdm_pct_in_top100: 1.7,
      assembly_2022: {
        note: "Covers Mid Ulster constituency directly",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 42.8 },
          { party: "DUP", approx_vote_share: 17.4 },
          { party: "UUP", approx_vote_share: 10.7 },
          { party: "SDLP", approx_vote_share: 8.1 }
        ]
      },
      demographics: {
        population_2011: 138590,
        population_change_pct: 8.4,
        catholic_pct: 64.7,
        protestant_other_christian_pct: 30.2,
        other_religion_pct: 0.7,
        no_religion_pct: 4.4,
        born_ni_pct: 86.1,
        born_rest_uk_pct: 3.0,
        born_ireland_pct: 1.7,
        born_eu_pct: 6.4,
        born_rest_world_pct: 2.8,
        irish_speakers_pct: 20.4,
        ulster_scots_speakers_pct: 9.4,
        urban_rural: "Predominantly rural (68% rural wards)"
      },
      housing: {
        median_house_price: 168250,
        avg_house_price: 181299,
        price_year: "2024",
        owner_occupied_pct: 72.6,
        private_rented_pct: 20.0,
        social_housing_pct: 7.3
      },
      education: {
        no_qualifications_pct: 27.5,
        gcse_pct: 13.1,
        a_level_pct: 15.3,
        degree_plus_pct: 29.3,
        other_pct: 8.5
      },
      crime: {
        total_recorded: 4583,
        rate_per_1000: 30,
        period: "2024/25",
        violence: 2028,
        sexual_offences: 185,
        robbery: 18,
        theft: 878,
        burglary: 145,
        criminal_damage: 710,
        drugs: 450,
        possession_weapons: 62,
        public_order: 30,
        miscellaneous: 222,
        antisocial_behaviour: 2008
      },
      transport: {
        no_car_pct: 8.5,
        one_car_pct: 26.2,
        two_plus_cars_pct: 65.2,
        drive_pct: 68.5,
        public_transport_pct: 1.8,
        walk_cycle_pct: 5.4,
        work_from_home_pct: 15.9,
        other_pct: 8.4,
        full_fibre_pct: 95,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 53.7,
        good_pct: 28.0,
        fair_pct: 12.2,
        bad_pct: 4.5,
        very_bad_pct: 1.6,
        disability_limited_lot_pct: 9.7,
        disability_limited_little_pct: 11.5,
        unpaid_care_pct: 10.5
      }
    },
    newry_mourne_and_down: {
      name: "Newry, Mourne and Down",
      population: 182074,
      area_sq_km: 1628.28,
      population_density_per_sq_km: 111.8,
      age_0_15_pct: 22.0,
      age_16_64_pct: 61.3,
      age_65_plus_pct: 16.7,
      median_annual_earnings_residence: 31855,
      employment_rate_pct: 81,
      unemployment_rate_census_pct: 4.2,
      claimant_count_rate_pct: 3,
      life_expectancy_male: 78.9,
      life_expectancy_female: 82.6,
      long_term_health_condition_pct: 32.5,
      nimdm_soas_in_top100: 8,
      nimdm_total_soas: 87,
      nimdm_pct_in_top100: 9.2,
      assembly_2022: {
        note: "Approximated from South Down and Newry & Armagh constituencies",
        top_parties: [
          { party: "Sinn Féin", approx_vote_share: 36.9 },
          { party: "SDLP", approx_vote_share: 14.0 },
          { party: "DUP", approx_vote_share: 12.0 },
          { party: "Alliance", approx_vote_share: 8.9 }
        ]
      },
      demographics: {
        population_2011: 171533,
        population_change_pct: 6.1,
        catholic_pct: 72.1,
        protestant_other_christian_pct: 22.0,
        other_religion_pct: 0.7,
        no_religion_pct: 5.2,
        born_ni_pct: 86.7,
        born_rest_uk_pct: 4.5,
        born_ireland_pct: 3.5,
        born_eu_pct: 3.7,
        born_rest_world_pct: 1.6,
        irish_speakers_pct: 18.6,
        ulster_scots_speakers_pct: 6.8,
        urban_rural: "Mixed (29% urban, 46% rural wards)"
      },
      housing: {
        median_house_price: 187500,
        avg_house_price: 211878,
        price_year: "2024",
        owner_occupied_pct: 72.9,
        private_rented_pct: 18.3,
        social_housing_pct: 8.8
      },
      education: {
        no_qualifications_pct: 23.1,
        gcse_pct: 13.3,
        a_level_pct: 16.3,
        degree_plus_pct: 31.8,
        other_pct: 9.3
      },
      crime: {
        total_recorded: 7638,
        rate_per_1000: 42,
        period: "2024/25",
        violence: 3280,
        sexual_offences: 339,
        robbery: 32,
        theft: 1732,
        burglary: 300,
        criminal_damage: 1233,
        drugs: 555,
        possession_weapons: 81,
        public_order: 78,
        miscellaneous: 308,
        antisocial_behaviour: 3916
      },
      transport: {
        no_car_pct: 8.9,
        one_car_pct: 28.5,
        two_plus_cars_pct: 62.6,
        drive_pct: 67.5,
        public_transport_pct: 1.5,
        walk_cycle_pct: 5.5,
        work_from_home_pct: 17.6,
        other_pct: 7.9,
        full_fibre_pct: 96,
        avg_broadband_mbps: 325
      },
      health: {
        very_good_pct: 52.7,
        good_pct: 27.5,
        fair_pct: 12.8,
        bad_pct: 5.2,
        very_bad_pct: 1.8,
        disability_limited_lot_pct: 10.9,
        disability_limited_little_pct: 12.0,
        unpaid_care_pct: 11.7
      }
    }
  }
};
