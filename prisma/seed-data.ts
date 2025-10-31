// prisma/seed-data-hematology.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding: Hematology');

  let category = await prisma.testCategory.findFirst({
    where: { name: 'Hematology' },
  });

  if (!category) {
    category = await prisma.testCategory.create({
      data: {
        name: 'Hematology',
        description: 'Blood cell analysis, differential counts, and coagulation-related hematologic investigations.',
      },
    });
  }

  const tests = [
    {
      name: 'Complete Blood Count (CBC)',
      code: 'CBC',
      specimen: 'Whole Blood',
      container: 'Lavender Top (EDTA)',
      volume: '3 mL',
      turnaround_time: '2h',
      fees: 25.0,
      parameters: [
        { name: 'White Blood Cells', code: 'WBC', units: 'x10^3/μL', normal_range_min: 4.5, normal_range_max: 11.0 },
        { name: 'Red Blood Cells', code: 'RBC', units: 'x10^6/μL', normal_range_min: 4.5, normal_range_max: 6.0 },
        { name: 'Hemoglobin', code: 'HGB', units: 'g/dL', normal_range_min: 13.5, normal_range_max: 17.5 },
        { name: 'Hematocrit', code: 'HCT', units: '%', normal_range_min: 40, normal_range_max: 52 },
        { name: 'MCV', code: 'MCV', units: 'fL', normal_range_min: 80, normal_range_max: 100 },
        { name: 'MCH', code: 'MCH', units: 'pg', normal_range_min: 27, normal_range_max: 33 },
        { name: 'MCHC', code: 'MCHC', units: 'g/dL', normal_range_min: 32, normal_range_max: 36 },
        { name: 'Platelets', code: 'PLT', units: 'x10^3/μL', normal_range_min: 150, normal_range_max: 450 },
        { name: 'Neutrophils', code: 'NEUT', units: '%', normal_range_min: 40, normal_range_max: 75 },
        { name: 'Lymphocytes', code: 'LYMPH', units: '%', normal_range_min: 20, normal_range_max: 50 },
      ],
    },
    {
      name: 'Peripheral Blood Smear',
      code: 'PBS',
      specimen: 'Whole Blood',
      container: 'Lavender Top (EDTA)',
      volume: '3 mL',
      turnaround_time: '4h',
      fees: 20.0,
      parameters: [
        { name: 'RBC Morphology', code: 'RBC_MORPH', normal_range_text: 'See Report' },
        { name: 'WBC Differential', code: 'WBC_DIFF', normal_range_text: 'See Report' },
        { name: 'Platelet Morphology', code: 'PLT_MORPH', normal_range_text: 'See Report' },
      ],
    },
    {
      name: 'Reticulocyte Count',
      code: 'RETIC',
      specimen: 'Whole Blood',
      container: 'Lavender Top (EDTA)',
      volume: '3 mL',
      turnaround_time: '4h',
      fees: 30.0,
      parameters: [
        { name: 'Reticulocyte Count', code: 'RETIC_CNT', units: '%', normal_range_min: 0.5, normal_range_max: 2.5 },
        { name: 'Comments', code: 'RETIC_COMM', normal_range_text: 'See Report' },
      ],
    },
    {
      name: 'Erythrocyte Sedimentation Rate (ESR)',
      code: 'ESR',
      specimen: 'Whole Blood',
      container: 'Black Top (Sodium Citrate)',
      volume: '3 mL',
      turnaround_time: '1h',
      fees: 15.0,
      parameters: [
        { name: 'ESR (Males)', code: 'ESR_M', units: 'mm/hr', normal_range_min: 0, normal_range_max: 20 },
        { name: 'ESR (Females)', code: 'ESR_F', units: 'mm/hr', normal_range_min: 0, normal_range_max: 30 },
      ],
    },
    {
      name: 'Packed Cell Volume (Hematocrit)',
      code: 'HCT',
      specimen: 'Whole Blood',
      container: 'Lavender Top (EDTA)',
      volume: '3 mL',
      turnaround_time: '1h',
      fees: 15.0,
      parameters: [
        { name: 'Hematocrit', code: 'HCT_VAL', units: '%', normal_range_min: 40, normal_range_max: 52 },
      ],
    },
    {
      name: 'Hemoglobin (Hb)',
      code: 'HGB',
      specimen: 'Whole Blood',
      container: 'Lavender Top (EDTA)',
      volume: '3 mL',
      turnaround_time: '1h',
      fees: 10.0,
      parameters: [
        { name: 'Hemoglobin', code: 'HGB_VAL', units: 'g/dL', normal_range_min: 13.5, normal_range_max: 17.5 },
      ],
    },
  ];

  for (const t of tests) {
    const test = await prisma.testTemplate.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        specimen: t.specimen,
        container: t.container,
        volume: t.volume,
        turnaround_time: t.turnaround_time,
        fees: t.fees,
      },
      create: {
        name: t.name,
        code: t.code,
        category_id: category.id,
        specimen: t.specimen,
        container: t.container,
        volume: t.volume,
        turnaround_time: t.turnaround_time,
        fees: t.fees,
      },
    });

    await prisma.testParameter.deleteMany({ where: { test_template_id: test.id } });

    await prisma.testParameter.createMany({
      data: t.parameters.map((p, i) => ({
        test_template_id: test.id,
        name: p.name,
        code: p.code,
        units: 'units' in p ? p.units ?? '' : '',
        normal_range_min: 'normal_range_min' in p ? p.normal_range_min ?? null : null,
        normal_range_max: 'normal_range_max' in p ? p.normal_range_max ?? null : null,
        normal_range_text:
          'normal_range_text' in p && typeof p.normal_range_text === 'string'
            ? p.normal_range_text
            : 'See Report',
        sort_order: i,
      })),
    });

    console.log(`Seeded: ${t.name}`);
  }

  console.log('Hematology seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
