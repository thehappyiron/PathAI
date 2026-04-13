/* ═══════════════════════════════════════════════════
   PathAI — Complete Indian Curriculum Data
   ═══════════════════════════════════════════════════ */

export interface Topic {
  name: string;
}

export interface Subject {
  name: string;
  icon: string;
  branches?: { name: string; topics: Topic[] }[];
  topics?: Topic[];
}

export interface Standard {
  label: string;
  subjects: Subject[];
}

export interface StdGroup {
  id: string;
  label: string;
  range: string;
  icon: string;
  color: string;
  standards: Standard[];
}

export const curriculum: StdGroup[] = [
  /* ══════════════════════════════════════
     STD 1–5
     ══════════════════════════════════════ */
  {
    id: "1-5",
    label: "Std 1st to 5th",
    range: "Primary",
    icon: "🌱",
    color: "#2D6A4F",
    standards: [
      {
        label: "Std 1–2",
        subjects: [
          {
            name: "Mathematics",
            icon: "📐",
            topics: [
              { name: "Numbers (1–100)" },
              { name: "Addition and subtraction" },
              { name: "Shapes and patterns" },
              { name: "Measurement (length, weight, time)" },
              { name: "Money basics" },
            ],
          },
          {
            name: "Environmental Science",
            icon: "🌿",
            topics: [
              { name: "Living and non-living things" },
              { name: "Plants and animals" },
              { name: "Human body basics" },
              { name: "Water, air, surroundings" },
              { name: "Food and shelter" },
            ],
          },
        ],
      },
      {
        label: "Std 3–5",
        subjects: [
          {
            name: "Mathematics",
            icon: "📐",
            topics: [
              { name: "Numbers (up to lakhs)" },
              { name: "Addition, subtraction, multiplication, division" },
              { name: "Fractions" },
              { name: "Geometry (basic shapes, symmetry)" },
              { name: "Measurement (time, length, weight, capacity)" },
              { name: "Data handling" },
            ],
          },
          {
            name: "Science (EVS)",
            icon: "🔬",
            topics: [
              { name: "Plants: parts and functions" },
              { name: "Animals: types and habitats" },
              { name: "Human body and health" },
              { name: "Food and nutrition" },
              { name: "Water cycle" },
              { name: "Air and its uses" },
              { name: "Force and motion (basic)" },
              { name: "Sun, moon, earth" },
            ],
          },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════
     STD 6–10
     ══════════════════════════════════════ */
  {
    id: "6-10",
    label: "Std 6th to 10th",
    range: "Secondary",
    icon: "📚",
    color: "#1B4F72",
    standards: [
      {
        label: "Std 6",
        subjects: [
          {
            name: "Mathematics", icon: "📐",
            topics: [
              { name: "Knowing numbers" }, { name: "Whole numbers" }, { name: "Playing with numbers" },
              { name: "Basic geometry" }, { name: "Integers" }, { name: "Fractions" },
              { name: "Decimals" }, { name: "Algebra (introduction)" }, { name: "Ratio and proportion" },
              { name: "Mensuration" }, { name: "Data handling" },
            ],
          },
          {
            name: "Science", icon: "🔬",
            branches: [
              { name: "Physics", topics: [{ name: "Motion and measurement of distances" }, { name: "Light, shadows, reflections" }, { name: "Electricity and circuits" }, { name: "Magnetism" }] },
              { name: "Chemistry", topics: [{ name: "Sorting materials into groups" }, { name: "Separation of substances" }, { name: "Changes around us" }] },
              { name: "Biology", topics: [{ name: "Components of food" }, { name: "Getting to know plants" }, { name: "Body movements" }, { name: "Living organisms and surroundings" }] },
            ],
          },
        ],
      },
      {
        label: "Std 7",
        subjects: [
          {
            name: "Mathematics", icon: "📐",
            topics: [
              { name: "Integers" }, { name: "Fractions and decimals" }, { name: "Data handling" },
              { name: "Simple equations" }, { name: "Lines and angles" }, { name: "Triangle properties" },
              { name: "Congruence" }, { name: "Comparing quantities" }, { name: "Rational numbers" },
              { name: "Perimeter and area" }, { name: "Algebraic expressions" },
            ],
          },
          {
            name: "Science", icon: "🔬",
            branches: [
              { name: "Physics", topics: [{ name: "Heat" }, { name: "Motion and time" }, { name: "Electric current and effects" }, { name: "Light" }] },
              { name: "Chemistry", topics: [{ name: "Acids, bases, salts" }, { name: "Physical and chemical changes" }, { name: "Fibre to fabric" }] },
              { name: "Biology", topics: [{ name: "Nutrition in plants and animals" }, { name: "Respiration" }, { name: "Transportation in plants and animals" }, { name: "Reproduction in plants" }, { name: "Forests and ecosystems" }] },
            ],
          },
        ],
      },
      {
        label: "Std 8",
        subjects: [
          {
            name: "Mathematics", icon: "📐",
            topics: [
              { name: "Rational numbers" }, { name: "Linear equations" }, { name: "Understanding quadrilaterals" },
              { name: "Data handling" }, { name: "Squares and square roots" }, { name: "Cubes and cube roots" },
              { name: "Comparing quantities" }, { name: "Algebraic expressions and identities" },
              { name: "Mensuration" }, { name: "Exponents and powers" },
            ],
          },
          {
            name: "Science", icon: "🔬",
            branches: [
              { name: "Physics", topics: [{ name: "Force and pressure" }, { name: "Friction" }, { name: "Sound" }, { name: "Light" }] },
              { name: "Chemistry", topics: [{ name: "Synthetic fibres and plastics" }, { name: "Metals and non-metals" }, { name: "Coal and petroleum" }, { name: "Combustion and flame" }] },
              { name: "Biology", topics: [{ name: "Crop production" }, { name: "Microorganisms" }, { name: "Cell structure" }, { name: "Reproduction" }, { name: "Adolescence" }, { name: "Conservation of plants and animals" }] },
            ],
          },
        ],
      },
      {
        label: "Std 9",
        subjects: [
          {
            name: "Mathematics", icon: "📐",
            topics: [
              { name: "Number systems" }, { name: "Polynomials" }, { name: "Coordinate geometry" },
              { name: "Linear equations in two variables" }, { name: "Euclid's geometry" },
              { name: "Lines and angles" }, { name: "Triangles" }, { name: "Quadrilaterals" },
              { name: "Areas of parallelograms and triangles" }, { name: "Circles" },
              { name: "Surface areas and volumes" }, { name: "Statistics" }, { name: "Probability" },
            ],
          },
          {
            name: "Science", icon: "🔬",
            branches: [
              { name: "Physics", topics: [{ name: "Motion" }, { name: "Laws of motion" }, { name: "Gravitation" }, { name: "Work and energy" }, { name: "Sound" }] },
              { name: "Chemistry", topics: [{ name: "Matter in our surroundings" }, { name: "Is matter around us pure" }, { name: "Atoms and molecules" }, { name: "Structure of atom" }] },
              { name: "Biology", topics: [{ name: "Cell (fundamental unit of life)" }, { name: "Tissues" }, { name: "Diversity in living organisms" }, { name: "Why do we fall ill" }, { name: "Natural resources" }, { name: "Improvement in food resources" }] },
            ],
          },
        ],
      },
      {
        label: "Std 10",
        subjects: [
          {
            name: "Mathematics", icon: "📐",
            topics: [
              { name: "Real numbers" }, { name: "Polynomials" }, { name: "Pair of linear equations" },
              { name: "Quadratic equations" }, { name: "Arithmetic progressions" }, { name: "Triangles" },
              { name: "Coordinate geometry" }, { name: "Trigonometry (identities, heights and distances)" },
              { name: "Circles" }, { name: "Constructions" }, { name: "Surface areas and volumes" },
              { name: "Statistics" }, { name: "Probability" },
            ],
          },
          {
            name: "Science", icon: "🔬",
            branches: [
              { name: "Physics", topics: [{ name: "Light (reflection and refraction)" }, { name: "Human eye and colourful world" }, { name: "Electricity" }, { name: "Magnetic effects of electric current" }, { name: "Sources of energy" }] },
              { name: "Chemistry", topics: [{ name: "Chemical reactions and equations" }, { name: "Acids, bases, salts" }, { name: "Metals and non-metals" }, { name: "Carbon and its compounds" }, { name: "Periodic classification of elements" }] },
              { name: "Biology", topics: [{ name: "Life processes" }, { name: "Control and coordination" }, { name: "Reproduction" }, { name: "Heredity and evolution" }, { name: "Our environment" }, { name: "Management of natural resources" }] },
            ],
          },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════
     STD 11
     ══════════════════════════════════════ */
  {
    id: "11",
    label: "11th",
    range: "Foundation",
    icon: "🎯",
    color: "#C9A84C",
    standards: [
      {
        label: "Std 11",
        subjects: [
          {
            name: "Mathematics (JEE Core)", icon: "📐",
            topics: [
              { name: "Sets" }, { name: "Relations and Functions" }, { name: "Trigonometric Functions" },
              { name: "Complex Numbers and Quadratic Equations" }, { name: "Linear Inequalities" },
              { name: "Permutations and Combinations" }, { name: "Binomial Theorem" },
              { name: "Sequences and Series" }, { name: "Straight Lines" }, { name: "Conic Sections" },
              { name: "Introduction to 3D Geometry" }, { name: "Limits and Derivatives (basic)" },
              { name: "Statistics" }, { name: "Probability" },
            ],
          },
          {
            name: "Physics (JEE + NEET)", icon: "⚛️",
            branches: [
              { name: "Mechanics", topics: [{ name: "Physical World and Units" }, { name: "Motion in a Straight Line" }, { name: "Motion in a Plane" }, { name: "Laws of Motion" }, { name: "Work, Energy, and Power" }, { name: "System of Particles and Rotational Motion" }, { name: "Gravitation" }] },
              { name: "Properties of Matter", topics: [{ name: "Mechanical Properties of Solids" }, { name: "Mechanical Properties of Fluids" }, { name: "Thermal Properties of Matter" }] },
              { name: "Thermodynamics & Kinetic Theory", topics: [{ name: "Thermodynamics" }, { name: "Kinetic Theory" }] },
              { name: "Oscillations & Waves", topics: [{ name: "Oscillations" }, { name: "Waves" }] },
            ],
          },
          {
            name: "Chemistry (JEE + NEET)", icon: "🧪",
            branches: [
              { name: "Physical Chemistry", topics: [{ name: "Some Basic Concepts of Chemistry (Mole Concept)" }, { name: "Structure of Atom" }, { name: "States of Matter" }, { name: "Thermodynamics" }, { name: "Equilibrium" }, { name: "Redox Reactions" }] },
              { name: "Inorganic Chemistry", topics: [{ name: "Classification of Elements and Periodicity" }, { name: "Chemical Bonding and Molecular Structure" }, { name: "Hydrogen" }, { name: "s-Block Elements" }, { name: "Some p-Block Elements" }] },
              { name: "Organic Chemistry", topics: [{ name: "Basic Principles and Techniques" }, { name: "Hydrocarbons" }, { name: "Environmental Chemistry" }] },
            ],
          },
          {
            name: "Biology (NEET)", icon: "🧬",
            branches: [
              { name: "Diversity & Structure", topics: [{ name: "The Living World" }, { name: "Biological Classification" }, { name: "Plant Kingdom" }, { name: "Animal Kingdom" }, { name: "Morphology of Flowering Plants" }, { name: "Anatomy of Flowering Plants" }, { name: "Structural Organisation in Animals" }] },
              { name: "Cell & Physiology", topics: [{ name: "Cell: Structure and Function" }, { name: "Biomolecules" }, { name: "Cell Cycle and Division" }, { name: "Transport in Plants" }, { name: "Mineral Nutrition" }, { name: "Photosynthesis" }, { name: "Respiration in Plants" }, { name: "Plant Growth and Development" }] },
              { name: "Human Physiology", topics: [{ name: "Digestion and Absorption" }, { name: "Breathing and Exchange of Gases" }, { name: "Body Fluids and Circulation" }, { name: "Excretory Products and Elimination" }, { name: "Locomotion and Movement" }, { name: "Neural Control and Coordination" }, { name: "Chemical Coordination and Integration" }] },
            ],
          },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════
     STD 12
     ══════════════════════════════════════ */
  {
    id: "12",
    label: "12th",
    range: "Advanced",
    icon: "🚀",
    color: "#9B2335",
    standards: [
      {
        label: "Std 12",
        subjects: [
          {
            name: "Mathematics (JEE Core)", icon: "📐",
            topics: [
              { name: "Relations and Functions (advanced)" }, { name: "Inverse Trigonometric Functions" },
              { name: "Matrices" }, { name: "Determinants" }, { name: "Continuity and Differentiability" },
              { name: "Applications of Derivatives" }, { name: "Integrals" },
              { name: "Applications of Integrals" }, { name: "Differential Equations" },
              { name: "Vector Algebra" }, { name: "Three-Dimensional Geometry" },
              { name: "Linear Programming" }, { name: "Probability" },
            ],
          },
          {
            name: "Physics (JEE + NEET)", icon: "⚛️",
            branches: [
              { name: "Electrodynamics", topics: [{ name: "Electric Charges and Fields" }, { name: "Electrostatic Potential and Capacitance" }, { name: "Current Electricity" }, { name: "Moving Charges and Magnetism" }, { name: "Magnetism and Matter" }, { name: "Electromagnetic Induction" }, { name: "Alternating Current" }] },
              { name: "Optics", topics: [{ name: "Ray Optics and Optical Instruments" }, { name: "Wave Optics" }] },
              { name: "Modern Physics", topics: [{ name: "Dual Nature of Radiation and Matter" }, { name: "Atoms" }, { name: "Nuclei" }, { name: "Semiconductor Electronics" }] },
            ],
          },
          {
            name: "Chemistry (JEE + NEET)", icon: "🧪",
            branches: [
              { name: "Physical Chemistry", topics: [{ name: "Solutions" }, { name: "Electrochemistry" }, { name: "Chemical Kinetics" }] },
              { name: "Inorganic Chemistry", topics: [{ name: "General Principles and Processes of Isolation of Elements" }, { name: "p-Block Elements" }, { name: "d- and f-Block Elements" }, { name: "Coordination Compounds" }] },
              { name: "Organic Chemistry", topics: [{ name: "Haloalkanes and Haloarenes" }, { name: "Alcohols, Phenols, and Ethers" }, { name: "Aldehydes, Ketones, and Carboxylic Acids" }, { name: "Amines" }, { name: "Biomolecules" }, { name: "Polymers" }, { name: "Chemistry in Everyday Life" }] },
            ],
          },
          {
            name: "Biology (NEET)", icon: "🧬",
            branches: [
              { name: "Reproduction & Genetics", topics: [{ name: "Reproduction in Organisms" }, { name: "Sexual Reproduction in Flowering Plants" }, { name: "Human Reproduction" }, { name: "Reproductive Health" }, { name: "Principles of Inheritance and Variation" }, { name: "Molecular Basis of Inheritance" }, { name: "Evolution" }] },
              { name: "Biology & Human Welfare", topics: [{ name: "Human Health and Disease" }, { name: "Strategies for Enhancement in Food Production" }, { name: "Microbes in Human Welfare" }] },
              { name: "Biotechnology", topics: [{ name: "Biotechnology: Principles and Processes" }, { name: "Biotechnology and its Applications" }] },
              { name: "Ecology", topics: [{ name: "Organisms and Populations" }, { name: "Ecosystem" }, { name: "Biodiversity and Conservation" }, { name: "Environmental Issues" }] },
            ],
          },
        ],
      },
    ],
  },
];
