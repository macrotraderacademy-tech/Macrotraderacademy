// Applies db/schema.sql and seeds demo content on an empty database.
// Runs as a one-shot compose service before the web app starts.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();

  const schema = await readFile(path.join(root, "db", "schema.sql"), "utf8");
  await client.query(schema);
  console.log("schema applied");

  const { rows } = await client.query("select count(*)::int as n from users");
  if (rows[0].n > 0) {
    console.log("database already seeded, skipping");
    return;
  }

  const teacherHash = await bcrypt.hash("Teacher123!", 10);
  const studentHash = await bcrypt.hash("Student123!", 10);

  const teacher = await client.query(
    `insert into users (email, password_hash, full_name, role)
     values ($1, $2, $3, 'TEACHER') returning id`,
    ["prof@macrotrader.academy", teacherHash, "Anna Rakoto"],
  );
  const student = await client.query(
    `insert into users (email, password_hash, full_name, role)
     values ($1, $2, $3, 'STUDENT') returning id`,
    ["etudiant@macrotrader.academy", studentHash, "Miora Andrianina"],
  );

  const teacherId = teacher.rows[0].id;
  const studentId = student.rows[0].id;

  const courseSeeds = [
    {
      title: "Fondamentaux du trading macro",
      summary:
        "Comprendre les forces qui font bouger les marchés : taux, inflation et banques centrales.",
      description:
        "Ce cours pose les bases indispensables du trading macro. Vous apprendrez à lire un calendrier économique, à interpréter les décisions de politique monétaire et à construire un raisonnement de marché solide avant de passer à l'exécution.",
      level: "Débutant",
      published: true,
      lessons: [
        {
          title: "Qu'est-ce que le trading macro ?",
          content:
            "Le trading macro consiste à prendre position sur des actifs en fonction de votre lecture de l'économie mondiale. Contrairement à l'analyse technique pure, l'approche macro part des données : croissance, inflation, emploi, politique monétaire.\n\nUn trader macro se pose trois questions : où en est le cycle économique, que va faire la banque centrale, et comment le marché est-il positionné par rapport à cette attente ?\n\nL'objectif de ce cours est de vous donner une méthode répétable plutôt qu'un ensemble de signaux.",
        },
        {
          title: "Lire une décision de banque centrale",
          content:
            "Une décision de politique monétaire se lit en trois temps : la décision elle-même (hausse, baisse, statu quo), le communiqué, puis la conférence de presse.\n\nLe marché réagit rarement à la décision seule : ce qui compte est l'écart entre la décision et ce qui était déjà anticipé. C'est cet écart, et non le niveau absolu des taux, qui produit le mouvement.\n\nExercice : prenez les trois dernières réunions de la Fed et notez la réaction du dollar dans l'heure suivante.",
        },
        {
          title: "Le calendrier économique comme outil",
          content:
            "Les publications macro créent des régimes de volatilité prévisibles. Avant chaque session, identifiez les trois publications majeures de la journée et leur heure.\n\nUne bonne pratique : ne pas ouvrir de nouvelle position dans les trente minutes qui précèdent une publication majeure, sauf si votre stratégie est explicitement événementielle.\n\nNotez chaque semaine les surprises (donnée publiée vs consensus) et leur impact : vous construirez progressivement votre propre carte de réactivité du marché.",
        },
      ],
    },
    {
      title: "Cycles économiques et rotation sectorielle",
      summary:
        "Identifier la phase du cycle et en déduire les actifs à privilégier.",
      description:
        "Un cycle économique se décompose en expansion, ralentissement, récession et reprise. Chaque phase favorise certains actifs. Ce cours vous apprend à situer le cycle avec des indicateurs avancés et à en tirer une allocation cohérente.",
      level: "Intermédiaire",
      published: true,
      lessons: [
        {
          title: "Les quatre phases du cycle",
          content:
            "Expansion : croissance et emploi en hausse, inflation modérée. Les actions cycliques et les matières premières sont généralement favorisées.\n\nRalentissement : la croissance décélère, les taux plafonnent. Les actifs de qualité et la duration obligataire redeviennent attractifs.\n\nRécession : contraction de l'activité, les banques centrales assouplissent. Les obligations longues et le dollar peuvent surperformer.\n\nReprise : les indicateurs avancés repartent. Les actifs les plus massacrés offrent souvent le meilleur couple rendement/risque.",
        },
        {
          title: "Indicateurs avancés à surveiller",
          content:
            "Trois familles d'indicateurs suffisent pour situer le cycle : les enquêtes auprès des directeurs d'achat (PMI), la courbe des taux, et les demandes hebdomadaires de chômage.\n\nLe PMI est le plus réactif : un franchissement durable de la barre des 50 signale un changement de régime.\n\nL'inversion de la courbe des taux est un signal avancé de ralentissement, mais son délai d'action est long et variable. Ne l'utilisez jamais seul.",
        },
      ],
    },
    {
      title: "Gestion du risque et psychologie",
      summary:
        "La taille de position et la discipline font la différence sur le long terme.",
      description:
        "Ce cours traite de ce qui sépare un trader durable d'un trader qui explose son compte : la taille de position, la définition du risque par trade, et la gestion des biais comportementaux.",
      level: "Débutant",
      published: false,
      lessons: [
        {
          title: "Risque par trade et taille de position",
          content:
            "La règle de base : ne jamais risquer plus de 1 à 2 % du capital sur une seule idée. Le risque se mesure à la distance entre votre entrée et votre invalidation, pas à la taille de votre conviction.\n\nTaille de position = (capital × risque %) / distance à l'invalidation.\n\nCette formule unique résout la majorité des problèmes de survie d'un compte.",
        },
      ],
    },
  ];

  for (const seed of courseSeeds) {
    const course = await client.query(
      `insert into courses (teacher_id, title, summary, description, level, published)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [
        teacherId,
        seed.title,
        seed.summary,
        seed.description,
        seed.level,
        seed.published,
      ],
    );
    const courseId = course.rows[0].id;

    let position = 0;
    for (const lesson of seed.lessons) {
      await client.query(
        `insert into lessons (course_id, title, content, position)
         values ($1, $2, $3, $4)`,
        [courseId, lesson.title, lesson.content, position],
      );
      position += 1;
    }

    // Give the demo student a head start on the first published course.
    if (seed.title === "Fondamentaux du trading macro") {
      await client.query(
        `insert into enrollments (course_id, user_id) values ($1, $2)`,
        [courseId, studentId],
      );
      await client.query(
        `insert into lesson_completions (lesson_id, user_id)
         select id, $2 from lessons where course_id = $1 and position = 0`,
        [courseId, studentId],
      );
    }
  }

  console.log("demo data seeded");
}

try {
  await main();
  await client.end();
} catch (error) {
  console.error("migration failed:", error);
  await client.end().catch(() => {});
  process.exit(1);
}
