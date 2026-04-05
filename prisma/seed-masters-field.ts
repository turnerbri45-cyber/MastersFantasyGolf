import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const H = (id: string | null) =>
  id ? `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png` : null;

// Masters 2026 field sorted by odds (favorite first)
// espnId confirmed working via HTTP 200 check; null = no confirmed photo
const MASTERS_FIELD = [
  { name: "Scottie Scheffler",       odds: 550,   espnId: "9478"    },
  { name: "Bryson DeChambeau",       odds: 1000,  espnId: "5769"    },
  { name: "Jon Rahm",                odds: 1000,  espnId: "6798"    },
  { name: "Rory McIlroy",            odds: 1100,  espnId: null      },
  { name: "Xander Schauffele",       odds: 1500,  espnId: null      },
  { name: "Ludvig Aberg",            odds: 1600,  espnId: null      },
  { name: "Matt Fitzpatrick",        odds: 2000,  espnId: null      },
  { name: "Cameron Young",           odds: 2000,  espnId: null      },
  { name: "Tommy Fleetwood",         odds: 2200,  espnId: "5539"    },
  { name: "Collin Morikawa",         odds: 2700,  espnId: null      },
  { name: "Justin Rose",             odds: 2700,  espnId: null      },
  { name: "Brooks Koepka",           odds: 3000,  espnId: null      },
  { name: "Jordan Spieth",           odds: 3300,  espnId: "5467"    },
  { name: "Hideki Matsuyama",        odds: 3500,  espnId: "5860"    },
  { name: "Min Woo Lee",             odds: 3500,  espnId: null      },
  { name: "Robert MacIntyre",        odds: 4000,  espnId: "11378"   },
  { name: "Viktor Hovland",          odds: 4000,  espnId: null      },
  { name: "Shane Lowry",             odds: 4500,  espnId: null      },
  { name: "Chris Gotterup",          odds: 5000,  espnId: null      },
  { name: "Tyrrell Hatton",          odds: 5500,  espnId: null      },
  { name: "Russell Henley",          odds: 5500,  espnId: "5409"    },
  { name: "Patrick Cantlay",         odds: 5500,  espnId: null      },
  { name: "Akshay Bhatia",           odds: 5500,  espnId: null      },
  { name: "Si Woo Kim",              odds: 5500,  espnId: "7081"    },
  { name: "Sepp Straka",             odds: 6000,  espnId: "8961"    },
  { name: "Joaquin Niemann",         odds: 6000,  espnId: "9780"    },
  { name: "Sam Burns",               odds: 6500,  espnId: null      },
  { name: "Justin Thomas",           odds: 6500,  espnId: null      },
  { name: "Corey Conners",           odds: 6500,  espnId: null      },
  { name: "Jason Day",               odds: 6500,  espnId: null      },
  { name: "Adam Scott",              odds: 6500,  espnId: null      },
  { name: "Jake Knapp",              odds: 6500,  espnId: null      },
  { name: "Sungjae Im",              odds: 7000,  espnId: null      },
  { name: "Marco Penge",             odds: 7000,  espnId: null      },
  { name: "Jacob Bridgeman",         odds: 7500,  espnId: null      },
  { name: "Nicolai Hojgaard",        odds: 8000,  espnId: null      },
  { name: "Cameron Smith",           odds: 8000,  espnId: null      },
  { name: "Will Zalatoris",          odds: 8000,  espnId: "9877"    },
  { name: "Sahith Theegala",         odds: 8000,  espnId: null      },
  { name: "Tony Finau",              odds: 9000,  espnId: "2230"    },
  { name: "Tom Kim",                 odds: 9000,  espnId: "4602673" },
  { name: "Keegan Bradley",          odds: 9000,  espnId: null      },
  { name: "Brian Harman",            odds: 10000, espnId: "1225"    },
  { name: "Dustin Johnson",          odds: 10000, espnId: "4848"    },
  { name: "Wyndham Clark",           odds: 10000, espnId: null      },
  { name: "Max Homa",                odds: 10000, espnId: "8973"    },
  { name: "Rickie Fowler",           odds: 12000, espnId: "3702"    },
  { name: "Billy Horschel",          odds: 12000, espnId: "5220"    },
  { name: "Harris English",          odds: 12000, espnId: null      },
  { name: "Danny Willett",           odds: 12000, espnId: null      },
  { name: "Phil Mickelson",          odds: 12000, espnId: null      },
  { name: "Tiger Woods",             odds: 15000, espnId: "462"     },
  { name: "Zach Johnson",            odds: 15000, espnId: null      },
  { name: "Louis Oosthuizen",        odds: 15000, espnId: null      },
  { name: "Lucas Glover",            odds: 15000, espnId: "2101"    },
  { name: "Kurt Kitayama",           odds: 15000, espnId: null      },
  { name: "Austin Eckroat",          odds: 15000, espnId: null      },
  { name: "Emiliano Grillo",         odds: 15000, espnId: "7026"    },
  { name: "Christiaan Bezuidenhout", odds: 15000, espnId: null      },
  { name: "Davis Riley",             odds: 15000, espnId: null      },
  { name: "Fred Couples",            odds: 20000, espnId: "137"     },
  { name: "Jose Maria Olazabal",     odds: 20000, espnId: "221"     },
  { name: "Trevor Immelman",         odds: 20000, espnId: "2326"    },
  { name: "Angel Cabrera",           odds: 20000, espnId: "1219"    },
  { name: "Sergio Garcia",           odds: 20000, espnId: "579"     },
  { name: "Bubba Watson",            odds: 20000, espnId: "3786"    },
  { name: "Charl Schwartzel",        odds: 20000, espnId: "4088"    },
  { name: "Matt Kuchar",             odds: 20000, espnId: null      },
  { name: "Webb Simpson",            odds: 20000, espnId: "4283"    },
  { name: "Denny McCarthy",          odds: 20000, espnId: "10054"   },
  { name: "J.T. Poston",             odds: 20000, espnId: "10505"   },
  { name: "Taylor Moore",            odds: 20000, espnId: "10664"   },
  { name: "J.J. Spaun",              odds: 20000, espnId: "10166"   },
  { name: "Eric Cole",               odds: 20000, espnId: "10522"   },
  { name: "Patrick Reed",            odds: 20000, espnId: null      },
  { name: "Mike Weir",               odds: 25000, espnId: "592"     },
  { name: "Larry Mize",              odds: 25000, espnId: "184"     },
  { name: "Bernhard Langer",         odds: 25000, espnId: "127"     },
  { name: "Mark O'Meara",            odds: 30000, espnId: "217"     },
  { name: "Sandy Lyle",              odds: 30000, espnId: "186"     },
  { name: "Ian Woosnam",             odds: 30000, espnId: "340"     },
  { name: "Nick Faldo",              odds: 30000, espnId: "141"     },
  { name: "Vijay Singh",             odds: 30000, espnId: "350"     },
];

const seen = new Set<string>();
const FIELD = MASTERS_FIELD.filter((p) => {
  if (seen.has(p.name)) return false;
  seen.add(p.name);
  return true;
});

async function main() {
  console.log("Clearing old field data...");
  await prisma.finalPick.deleteMany();
  await prisma.golferPick.deleteMany();
  await prisma.tournamentScore.deleteMany();
  await prisma.golfer.deleteMany();

  console.log(`Seeding ${FIELD.length} Masters field players...`);
  for (let i = 0; i < FIELD.length; i++) {
    const p = FIELD[i];
    await prisma.golfer.create({
      data: {
        id: `masters-${i + 1}`,
        name: p.name,
        odds: p.odds,
        oddsRank: i + 1,
        imageUrl: H(p.espnId),
        isMadeCut: true,
      },
    });
  }

  const hash = await bcrypt.hash("password123", 10);
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice", passwordHash: hash },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob", passwordHash: hash },
  });

  const league = await prisma.league.upsert({
    where: { inviteCode: "DEMO1234" },
    update: {},
    create: {
      name: "Masters 2026 Demo League",
      inviteCode: "DEMO1234",
      ownerId: alice.id,
    },
  });

  for (const userId of [alice.id, bob.id]) {
    await prisma.leagueMember.upsert({
      where: { userId_leagueId: { userId, leagueId: league.id } },
      update: {},
      create: { userId, leagueId: league.id },
    });
  }

  const withPhoto = FIELD.filter((p) => p.espnId).length;
  console.log(`Done. ${FIELD.length} golfers seeded (${withPhoto} with photos).`);
  console.log("Demo: alice@example.com / password123  (league: DEMO1234)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
