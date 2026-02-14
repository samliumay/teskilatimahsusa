import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import {
  person,
  organization,
  event,
  personToPersonRelation,
  personToOrgRelation,
  orgToOrgRelation,
  eventToPerson,
  eventToOrganization,
  eventToEvent,
} from '../lib/db/schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Clearing existing data...');
  await db.execute(sql`TRUNCATE event_to_event, event_to_organization, event_to_person, org_to_org_relation, person_to_org_relation, person_to_person_relation, file, event, organization, person CASCADE`);

  console.log('Seeding database...\n');

  // ═══════════════════════════════════════════════════════
  // OPERATION CRESCENT — A fictitious intelligence scenario
  // Tracking a network moving funds through shell companies,
  // NGOs, and front businesses across Turkey, Europe, and
  // the Middle East.
  // ═══════════════════════════════════════════════════════

  // ─── PEOPLE ────────────────────────────────────────────

  const people = await db
    .insert(person)
    .values([
      // ── Core Network ──
      {
        firstName: 'Mehmet',
        lastName: 'Kara',
        aliases: ['The Architect', 'M.K.', 'Uncle'],
        dateOfBirth: new Date('1971-03-15'),
        nationality: 'Turkish',
        gender: 'Male',
        email: ['m.kara@crescent-consulting.example.com'],
        phone: ['+90-532-555-0171'],
        address: 'Nisantasi, Istanbul',
        passportNo: 'U09284731',
        riskLevel: 'CRITICAL',
        tags: ['primary-subject', 'operation-crescent', 'financier'],
        notes: 'Primary subject. Believed to be the architect of the financial network. Former banker, left Garanti BBVA in 2018 under unclear circumstances. Maintains residences in Istanbul, Zurich, and Dubai.',
        socialMedia: { twitter: '@mkara_consulting', linkedin: 'mehmet-kara-consulting' },
      },
      {
        firstName: 'Elif',
        lastName: 'Demir',
        aliases: ['The Accountant'],
        dateOfBirth: new Date('1984-07-22'),
        nationality: 'Turkish',
        gender: 'Female',
        email: ['elif.demir@nightowl-foundation.example.org', 'e.demir@proton.example.com'],
        phone: ['+41-76-555-0184'],
        address: 'Seefeld, Zurich',
        riskLevel: 'HIGH',
        tags: ['operation-crescent', 'financial-operator', 'zurich-cell'],
        notes: 'Manages financial flows through the Night Owl Foundation. CPA background. Relocated from Istanbul to Zurich in 2021. Handles the Swiss banking relationships.',
      },
      {
        firstName: 'Dmitri',
        lastName: 'Volkov',
        aliases: ['Dima', 'The Courier'],
        dateOfBirth: new Date('1988-11-03'),
        nationality: 'Russian',
        gender: 'Male',
        phone: ['+7-915-555-0188', '+90-537-555-0188'],
        riskLevel: 'HIGH',
        tags: ['operation-crescent', 'logistics', 'dual-national'],
        notes: 'Russian-Turkish dual background. Handles physical logistics — document transport, cash movements. Frequently travels Istanbul-Moscow-Dubai route. Former military (Russian Army, discharged 2012).',
      },
      {
        firstName: 'Layla',
        lastName: 'Hassan',
        dateOfBirth: new Date('1990-05-18'),
        nationality: 'Lebanese',
        gender: 'Female',
        email: ['l.hassan@cedargate.example.com'],
        phone: ['+961-3-555-019'],
        address: 'Hamra, Beirut',
        riskLevel: 'MEDIUM',
        tags: ['operation-crescent', 'beirut-cell', 'facilitator'],
        notes: 'Runs Cedar Gate Trading in Beirut. Believed to be the Middle East endpoint of the financial chain. Family connections to Lebanese banking sector.',
      },
      {
        firstName: 'Hans',
        lastName: 'Richter',
        dateOfBirth: new Date('1965-09-30'),
        nationality: 'German',
        gender: 'Male',
        email: ['h.richter@richter-legal.example.de'],
        phone: ['+49-30-555-0165'],
        address: 'Charlottenburg, Berlin',
        passportNo: 'C4F7R8291',
        riskLevel: 'MEDIUM',
        tags: ['legal-enabler', 'berlin-cell', 'corporate-structuring'],
        notes: 'Corporate lawyer specializing in offshore structures. Sets up shell companies and handles legal compliance layer. Plausible deniability — may not know the full picture.',
      },
      // ── Periphery / Associates ──
      {
        firstName: 'Sarah',
        lastName: 'Winters',
        dateOfBirth: new Date('1982-01-14'),
        nationality: 'British',
        gender: 'Female',
        email: ['s.winters@globalcorp.example.com'],
        phone: ['+44-20-555-0182'],
        address: 'Canary Wharf, London',
        riskLevel: 'LOW',
        tags: ['corporate', 'unwitting', 'globalcorp'],
        notes: 'GlobalCorp VP. Legitimate businessperson. May be an unwitting facilitator through corporate partnerships. Met Elif at Davos 2025.',
      },
      {
        firstName: 'Ahmet',
        lastName: 'Yilmaz',
        dateOfBirth: new Date('1979-04-11'),
        nationality: 'Turkish',
        gender: 'Male',
        email: ['a.yilmaz@istanbul-trade.example.com'],
        phone: ['+90-212-555-0179'],
        address: 'Levent, Istanbul',
        riskLevel: 'LOW',
        tags: ['istanbul-trade', 'operations', 'verified'],
        notes: 'Operations manager at Istanbul Trade Holdings. Long-time employee. Appears clean but has access to shipping manifests.',
      },
      {
        firstName: 'Kemal',
        lastName: 'Ozturk',
        aliases: ['K.O.'],
        dateOfBirth: new Date('1995-12-08'),
        nationality: 'Turkish',
        gender: 'Male',
        phone: ['+90-542-555-0195'],
        riskLevel: 'LOW',
        tags: ['informant', 'active', 'reliable'],
        notes: 'HUMINT source. Works at the Beyoglu cafe frequented by subjects. Reports on meetings and movements. Recruited Jan 2025.',
      },
      {
        firstName: 'Omar',
        lastName: 'Al-Rashid',
        aliases: ['Abu Tariq'],
        dateOfBirth: new Date('1975-08-20'),
        nationality: 'Iraqi',
        gender: 'Male',
        phone: ['+964-770-555-0175'],
        address: 'Erbil, Iraq',
        riskLevel: 'HIGH',
        tags: ['operation-crescent', 'erbil-cell', 'end-user'],
        notes: 'Erbil-based businessman. Suspected final recipient of diverted funds. Construction company may be a front. Known associate of regional power brokers.',
      },
      {
        firstName: 'Natasha',
        lastName: 'Petrova',
        dateOfBirth: new Date('1991-02-25'),
        nationality: 'Russian',
        gender: 'Female',
        email: ['n.petrova@volkov-logistics.example.ru'],
        phone: ['+7-495-555-0191'],
        address: 'Tverskaya, Moscow',
        riskLevel: 'MEDIUM',
        tags: ['logistics', 'moscow-cell', 'volkov-associate'],
        notes: 'Office manager at Volkov Logistics. Dmitri Volkov\'s business partner. Handles Moscow end of shipping documentation.',
      },
      {
        firstName: 'Yusuf',
        lastName: 'Erdogan',
        dateOfBirth: new Date('1968-06-12'),
        nationality: 'Turkish',
        gender: 'Male',
        email: ['y.erdogan@gov.example.tr'],
        riskLevel: 'MEDIUM',
        tags: ['government', 'customs', 'person-of-interest'],
        notes: 'Senior customs official at Istanbul port. Unusual wealth indicators. Possible corrupt insider facilitating shipments.',
      },
      {
        firstName: 'Maria',
        lastName: 'Conti',
        dateOfBirth: new Date('1987-10-05'),
        nationality: 'Italian',
        gender: 'Female',
        email: ['m.conti@europa-art.example.it'],
        phone: ['+39-02-555-0187'],
        address: 'Brera, Milan',
        riskLevel: 'LOW',
        tags: ['art-dealer', 'milan-cell', 'money-laundering'],
        notes: 'Art dealer in Milan. High-value art transactions may be used for value transfer. Gallery received paintings shipped from Istanbul.',
      },
    ])
    .returning();

  const [mehmet, elif, dmitri, layla, hans, sarah, ahmet, kemal, omar, natasha, yusuf, maria] = people;

  // ─── ORGANIZATIONS ─────────────────────────────────────

  const orgs = await db
    .insert(organization)
    .values([
      {
        name: 'Crescent Consulting Group',
        type: 'company',
        industry: 'Management Consulting',
        country: 'Turkey',
        address: 'Maslak, Istanbul',
        website: 'https://crescent-consulting.example.com',
        email: ['info@crescent-consulting.example.com'],
        riskLevel: 'HIGH',
        tags: ['front-company', 'operation-crescent', 'primary'],
        description: 'Mehmet Kara\'s primary business vehicle. Registered as a management consultancy but generates revenue inconsistent with client base. Used to invoice shell companies.',
      },
      {
        name: 'Night Owl Foundation',
        type: 'ngo',
        industry: 'Humanitarian Aid',
        country: 'Switzerland',
        address: 'Bahnhofstrasse 42, Zurich',
        website: 'https://nightowl-foundation.example.org',
        email: ['contact@nightowl-foundation.example.org'],
        riskLevel: 'HIGH',
        tags: ['suspected-front', 'operation-crescent', 'zurich'],
        description: 'Registered Swiss NGO ostensibly providing humanitarian aid. Financial analysis shows funds cycling through the foundation with minimal actual aid distribution. Elif Demir is the operational manager.',
      },
      {
        name: 'Istanbul Trade Holdings',
        type: 'company',
        industry: 'Import/Export',
        country: 'Turkey',
        address: 'Levent, Istanbul',
        website: 'https://istanbul-trade.example.com',
        phone: ['+90-212-555-0100'],
        riskLevel: 'MEDIUM',
        tags: ['logistics', 'investigated', 'legitimate-cover'],
        description: 'Legitimate import/export company with 200+ employees. Used as a logistics layer — some shipments diverted or contain undeclared items. Most employees unaware of illicit use.',
      },
      {
        name: 'GlobalCorp International',
        type: 'company',
        industry: 'Consulting',
        country: 'United Kingdom',
        address: 'One Canada Square, London',
        website: 'https://globalcorp.example.com',
        riskLevel: 'LOW',
        tags: ['multinational', 'legitimate', 'unwitting'],
        description: 'Major legitimate consulting firm. Partnership with Istanbul Trade Holdings provides cover for financial flows. Likely unwitting participant.',
      },
      {
        name: 'Cedar Gate Trading',
        type: 'company',
        industry: 'Trading',
        country: 'Lebanon',
        address: 'Hamra Street, Beirut',
        phone: ['+961-1-555-0100'],
        riskLevel: 'HIGH',
        tags: ['operation-crescent', 'beirut', 'endpoint'],
        description: 'Beirut-based trading company run by Layla Hassan. Handles the Middle East endpoint of fund transfers. Trades in commodities that are difficult to value accurately.',
      },
      {
        name: 'Volkov Logistics GmbH',
        type: 'company',
        industry: 'Shipping & Logistics',
        country: 'Germany',
        address: 'Friedrichshain, Berlin',
        phone: ['+49-30-555-0200'],
        riskLevel: 'MEDIUM',
        tags: ['logistics', 'berlin', 'shell-company'],
        description: 'German-registered logistics company. Despite the German registration, operations run from Moscow. Handles shipping documentation for goods moving through the network.',
      },
      {
        name: 'Richter & Partners Legal',
        type: 'company',
        industry: 'Legal Services',
        country: 'Germany',
        address: 'Kurfurstendamm, Berlin',
        website: 'https://richter-legal.example.de',
        riskLevel: 'MEDIUM',
        tags: ['legal', 'corporate-structuring', 'enabler'],
        description: 'Corporate law firm specializing in international company formation. Hans Richter is the senior partner. Created several shell entities used in the network.',
      },
      {
        name: 'Al-Rashid Construction',
        type: 'company',
        industry: 'Construction',
        country: 'Iraq',
        address: 'Erbil, Kurdistan Region',
        riskLevel: 'HIGH',
        tags: ['operation-crescent', 'erbil', 'end-recipient'],
        description: 'Construction company in Erbil. Receives large payments for "consulting" and "project management" from Cedar Gate Trading. Actual construction output minimal compared to revenue.',
      },
      {
        name: 'Europa Art Gallery',
        type: 'company',
        industry: 'Art & Antiquities',
        country: 'Italy',
        address: 'Via Brera 15, Milan',
        website: 'https://europa-art.example.it',
        riskLevel: 'MEDIUM',
        tags: ['money-laundering', 'art-market', 'value-transfer'],
        description: 'High-end art gallery. Received shipments of artwork from Istanbul at inflated valuations. Art market used as alternative value transfer system.',
      },
    ])
    .returning();

  const [crescent, nightOwl, istanbulTrade, globalCorp, cedarGate, volkovLogistics, richterLegal, alRashid, europaArt] = orgs;

  // ─── EVENTS ────────────────────────────────────────────

  const events = await db
    .insert(event)
    .values([
      {
        title: 'Richter registers Volkov Logistics GmbH',
        type: 'corporate',
        description: 'Hans Richter files incorporation papers for Volkov Logistics GmbH in Berlin. Dmitri Volkov listed as sole director. Capital: EUR 25,000.',
        date: new Date('2024-06-15T10:00:00Z'),
        location: 'Berlin, Germany',
        country: 'Germany',
        estimatedStatus: 'CONFIRMED',
        tags: ['corporate-formation', 'operation-crescent', 'origin'],
      },
      {
        title: 'Night Owl Foundation receives CHF 2M donation',
        type: 'transaction',
        description: 'Anonymous donation of CHF 2,000,000 to the Night Owl Foundation from a numbered account at a Liechtenstein bank. Origin of funds unclear.',
        date: new Date('2024-09-03T09:00:00Z'),
        location: 'Zurich, Switzerland',
        country: 'Switzerland',
        estimatedStatus: 'CONFIRMED',
        tags: ['financial', 'suspicious', 'large-transaction'],
      },
      {
        title: 'Davos side meeting — Elif and Sarah',
        type: 'meeting',
        description: 'Elif Demir meets Sarah Winters at a World Economic Forum side event. They discuss potential partnership between Night Owl Foundation and GlobalCorp CSR initiatives.',
        date: new Date('2025-01-20T18:00:00Z'),
        location: 'Davos, Switzerland',
        country: 'Switzerland',
        latitude: 46.8003,
        longitude: 9.8361,
        estimatedStatus: 'CONFIRMED',
        tags: ['networking', 'davos', 'partnership-origin'],
      },
      {
        title: 'Istanbul cafe meeting — Mehmet, Dmitri, Ahmet',
        type: 'meeting',
        description: 'Unscheduled meeting at cafe in Beyoglu. Subject Mehmet Kara met with Dmitri Volkov and Ahmet Yilmaz for approximately 90 minutes. Informant Kemal observed and reported. Brown envelope exchanged.',
        date: new Date('2025-04-12T14:30:00Z'),
        location: 'Beyoglu, Istanbul',
        country: 'Turkey',
        latitude: 41.0332,
        longitude: 28.977,
        estimatedStatus: 'CONFIRMED',
        tags: ['covert', 'surveilled', 'humint'],
      },
      {
        title: 'Wire transfer CHF 500K — Night Owl to Cedar Gate',
        type: 'transaction',
        description: 'Night Owl Foundation transfers CHF 500,000 to Cedar Gate Trading labeled as "humanitarian aid procurement — medical supplies." No corresponding medical supply orders found.',
        date: new Date('2025-05-08T09:30:00Z'),
        location: 'Zurich, Switzerland',
        country: 'Switzerland',
        estimatedStatus: 'CONFIRMED',
        tags: ['financial', 'flagged', 'cross-border'],
      },
      {
        title: 'Art shipment Istanbul to Milan',
        type: 'transaction',
        description: 'Istanbul Trade Holdings ships 4 crates of "Ottoman-era decorative arts" to Europa Art Gallery in Milan. Customs declaration values: EUR 340,000. Insurance valuation: EUR 1,200,000. Significant discrepancy.',
        date: new Date('2025-06-20T07:00:00Z'),
        location: 'Istanbul Port',
        country: 'Turkey',
        latitude: 41.0053,
        longitude: 28.9553,
        estimatedStatus: 'CONFIRMED',
        tags: ['logistics', 'valuation-discrepancy', 'art-market'],
      },
      {
        title: 'Berlin meeting — Mehmet, Hans, Dmitri',
        type: 'meeting',
        description: 'Three-day meeting at Richter & Partners office in Berlin. Topics believed to include restructuring of corporate entities and new routing for financial flows. Surveillance limited — counter-surveillance measures detected.',
        date: new Date('2025-08-10T10:00:00Z'),
        endDate: new Date('2025-08-12T18:00:00Z'),
        location: 'Kurfurstendamm, Berlin',
        country: 'Germany',
        latitude: 52.5026,
        longitude: 13.3231,
        estimatedStatus: 'CONFIRMED',
        tags: ['strategic', 'counter-surveillance', 'high-priority'],
      },
      {
        title: 'Cedar Gate payment to Al-Rashid Construction',
        type: 'transaction',
        description: 'Cedar Gate Trading pays USD 750,000 to Al-Rashid Construction for "project management consulting — Phase 3." No evidence of actual construction project Phase 3 existing.',
        date: new Date('2025-09-15T11:00:00Z'),
        location: 'Beirut, Lebanon',
        country: 'Lebanon',
        estimatedStatus: 'CONFIRMED',
        tags: ['financial', 'endpoint', 'phantom-invoice'],
      },
      {
        title: 'Yusuf Erdogan clears suspicious shipment',
        type: 'incident',
        description: 'Customs official Yusuf Erdogan personally overrides a hold on an Istanbul Trade Holdings container flagged for secondary inspection. Container released without examination.',
        date: new Date('2025-10-02T15:45:00Z'),
        location: 'Istanbul Ambarli Port',
        country: 'Turkey',
        latitude: 40.9823,
        longitude: 28.6918,
        estimatedStatus: 'CONFIRMED',
        tags: ['corruption', 'customs', 'insider-threat'],
      },
      {
        title: 'Erbil site visit — Omar and Layla',
        type: 'meeting',
        description: 'Layla Hassan travels to Erbil for a meeting with Omar Al-Rashid. Cover story: inspecting construction project. Satellite imagery shows no active construction at the declared site.',
        date: new Date('2025-11-18T09:00:00Z'),
        endDate: new Date('2025-11-20T17:00:00Z'),
        location: 'Erbil, Kurdistan Region',
        country: 'Iraq',
        latitude: 36.1911,
        longitude: 44.0094,
        estimatedStatus: 'CONFIRMED',
        tags: ['site-visit', 'cover-story', 'sigint'],
      },
      {
        title: 'Moscow cash withdrawal — Natasha',
        type: 'transaction',
        description: 'Natasha Petrova withdraws RUB 8,500,000 (~USD 85,000) in cash from Volkov Logistics account over 3 days. Structured to avoid single-transaction reporting threshold.',
        date: new Date('2025-12-01T10:00:00Z'),
        endDate: new Date('2025-12-03T16:00:00Z'),
        location: 'Moscow, Russia',
        country: 'Russia',
        latitude: 55.7558,
        longitude: 37.6173,
        estimatedStatus: 'CONFIRMED',
        tags: ['financial', 'structuring', 'cash'],
      },
      {
        title: 'Encrypted communications spike detected',
        type: 'communication',
        description: 'SIGINT detects a 400% increase in encrypted message traffic between known devices associated with Mehmet, Elif, and Layla over 48-hour period. Possible operational planning.',
        date: new Date('2026-01-28T00:00:00Z'),
        endDate: new Date('2026-01-29T23:59:00Z'),
        location: 'Multiple locations',
        estimatedStatus: 'CONFIRMED',
        tags: ['sigint', 'encrypted', 'comms-spike', 'high-priority'],
      },
    ])
    .returning();

  const [richterIncorp, nightOwlDonation, davosMeeting, cafeMeeting, nightOwlTransfer, artShipment, berlinMeeting, cedarPayment, customsClear, erbilVisit, moscowCash, commSpike] = events;

  // ─── PERSON-TO-PERSON RELATIONS ────────────────────────

  await db.insert(personToPersonRelation).values([
    {
      sourcePersonId: mehmet!.id,
      targetPersonId: elif!.id,
      relationshipType: 'handler',
      strength: 'STRONG',
      estimatedStatus: 'CONFIRMED',
      context: 'Mehmet directs Elif\'s financial operations. They communicate via encrypted channels. Relationship predates the network — former colleagues at Garanti BBVA.',
      startDate: new Date('2018-01-01'),
    },
    {
      sourcePersonId: mehmet!.id,
      targetPersonId: dmitri!.id,
      relationshipType: 'handler',
      strength: 'STRONG',
      estimatedStatus: 'CONFIRMED',
      context: 'Mehmet tasks Dmitri with logistics operations. Dmitri appears loyal and operational. Recruited through mutual contacts in Istanbul expat community.',
      startDate: new Date('2020-06-01'),
    },
    {
      sourcePersonId: mehmet!.id,
      targetPersonId: hans!.id,
      relationshipType: 'client',
      strength: 'MODERATE',
      estimatedStatus: 'CONFIRMED',
      context: 'Professional relationship. Hans provides legal services. May not know the full extent of the network.',
      startDate: new Date('2023-01-01'),
    },
    {
      sourcePersonId: mehmet!.id,
      targetPersonId: omar!.id,
      relationshipType: 'partner',
      strength: 'MODERATE',
      estimatedStatus: 'SUSPECTED',
      context: 'Endpoint connection. Omar receives funds. Relationship believed to predate the network — possibly family or tribal connections.',
    },
    {
      sourcePersonId: elif!.id,
      targetPersonId: sarah!.id,
      relationshipType: 'business associate',
      strength: 'WEAK',
      estimatedStatus: 'CONFIRMED',
      context: 'Met at Davos 2025. Elif cultivating Sarah for legitimate cover partnerships.',
      startDate: new Date('2025-01-20'),
    },
    {
      sourcePersonId: elif!.id,
      targetPersonId: layla!.id,
      relationshipType: 'financial counterpart',
      strength: 'STRONG',
      estimatedStatus: 'CONFIRMED',
      context: 'Elif sends funds, Layla receives. Regular encrypted communication. Elif visited Beirut twice in 2025.',
    },
    {
      sourcePersonId: dmitri!.id,
      targetPersonId: natasha!.id,
      relationshipType: 'business partner',
      strength: 'STRONG',
      estimatedStatus: 'CONFIRMED',
      context: 'Co-run Volkov Logistics. Natasha handles Moscow operations while Dmitri travels.',
    },
    {
      sourcePersonId: dmitri!.id,
      targetPersonId: ahmet!.id,
      relationshipType: 'operational contact',
      strength: 'MODERATE',
      estimatedStatus: 'SUSPECTED',
      context: 'Dmitri coordinates shipping logistics with Ahmet. Ahmet may believe all shipments are legitimate.',
    },
    {
      sourcePersonId: layla!.id,
      targetPersonId: omar!.id,
      relationshipType: 'business partner',
      strength: 'STRONG',
      estimatedStatus: 'CONFIRMED',
      context: 'Layla\'s Cedar Gate pays Omar\'s Al-Rashid Construction. Regular meetings in Erbil.',
    },
    {
      sourcePersonId: mehmet!.id,
      targetPersonId: yusuf!.id,
      relationshipType: 'corrupt contact',
      strength: 'MODERATE',
      estimatedStatus: 'SUSPECTED',
      context: 'Yusuf facilitates customs clearance. Suspected cash payments. Relationship estimated to start mid-2024.',
    },
    {
      sourcePersonId: ahmet!.id,
      targetPersonId: maria!.id,
      relationshipType: 'shipping contact',
      strength: 'WEAK',
      estimatedStatus: 'CONFIRMED',
      context: 'Ahmet arranges art shipments to Maria\'s gallery. Commercial relationship.',
    },
  ]);

  // ─── PERSON-TO-ORG RELATIONS ───────────────────────────

  await db.insert(personToOrgRelation).values([
    { personId: mehmet!.id, organizationId: crescent!.id, role: 'Founder & CEO', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: elif!.id, organizationId: nightOwl!.id, role: 'Operations Director', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: elif!.id, organizationId: crescent!.id, role: 'Financial Advisor', currentlyActive: true, estimatedStatus: 'SUSPECTED', context: 'Unofficial role. Manages Crescent\'s actual finances.' },
    { personId: dmitri!.id, organizationId: volkovLogistics!.id, role: 'Director', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: natasha!.id, organizationId: volkovLogistics!.id, role: 'Office Manager', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: layla!.id, organizationId: cedarGate!.id, role: 'Managing Director', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: hans!.id, organizationId: richterLegal!.id, role: 'Senior Partner', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: hans!.id, organizationId: volkovLogistics!.id, role: 'Legal Counsel', currentlyActive: true, estimatedStatus: 'CONFIRMED', context: 'Registered the company. Provides ongoing legal services.' },
    { personId: sarah!.id, organizationId: globalCorp!.id, role: 'VP, EMEA Region', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: ahmet!.id, organizationId: istanbulTrade!.id, role: 'Operations Manager', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: omar!.id, organizationId: alRashid!.id, role: 'Owner', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: maria!.id, organizationId: europaArt!.id, role: 'Gallery Director', currentlyActive: true, estimatedStatus: 'CONFIRMED' },
    { personId: yusuf!.id, organizationId: istanbulTrade!.id, role: 'Customs Liaison', currentlyActive: true, estimatedStatus: 'SUSPECTED', context: 'Unofficial role. Facilitates smooth customs clearance.' },
    { personId: mehmet!.id, organizationId: nightOwl!.id, role: 'Board Member', currentlyActive: true, estimatedStatus: 'SUSPECTED', context: 'Name not on public filings. Identified through leaked internal documents.' },
    { personId: mehmet!.id, organizationId: istanbulTrade!.id, role: 'Silent Partner', currentlyActive: true, estimatedStatus: 'SUSPECTED', context: 'Holds undisclosed stake through nominee shareholders.' },
  ]);

  // ─── ORG-TO-ORG RELATIONS ─────────────────────────────

  await db.insert(orgToOrgRelation).values([
    {
      sourceOrgId: crescent!.id,
      targetOrgId: nightOwl!.id,
      relationshipType: 'financial-link',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Crescent Consulting invoices Night Owl for "consulting services." Payments flow Crescent -> Night Owl -> outbound.',
    },
    {
      sourceOrgId: nightOwl!.id,
      targetOrgId: cedarGate!.id,
      relationshipType: 'financial-link',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Night Owl transfers funds to Cedar Gate as "humanitarian aid procurement." Primary financial pipeline.',
    },
    {
      sourceOrgId: cedarGate!.id,
      targetOrgId: alRashid!.id,
      relationshipType: 'financial-link',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Cedar Gate pays Al-Rashid for phantom construction projects. Funds reach endpoint.',
    },
    {
      sourceOrgId: globalCorp!.id,
      targetOrgId: istanbulTrade!.id,
      relationshipType: 'partner',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Legitimate business partnership. Provides cover and credibility.',
    },
    {
      sourceOrgId: istanbulTrade!.id,
      targetOrgId: europaArt!.id,
      relationshipType: 'shipping-client',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Istanbul Trade ships artwork to Europa Art. Valuations heavily inflated.',
    },
    {
      sourceOrgId: volkovLogistics!.id,
      targetOrgId: istanbulTrade!.id,
      relationshipType: 'logistics-partner',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Volkov handles shipping documentation for Istanbul Trade\'s European routes.',
    },
    {
      sourceOrgId: richterLegal!.id,
      targetOrgId: crescent!.id,
      relationshipType: 'legal-services',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Richter & Partners provides corporate structuring services to Crescent.',
    },
    {
      sourceOrgId: richterLegal!.id,
      targetOrgId: volkovLogistics!.id,
      relationshipType: 'legal-services',
      estimatedStatus: 'CONFIRMED',
      currentlyActive: true,
      context: 'Richter registered the company and maintains its compliance filings.',
    },
  ]);

  // ─── EVENT-TO-PERSON LINKS ────────────────────────────

  await db.insert(eventToPerson).values([
    // Richter incorporation
    { eventId: richterIncorp!.id, personId: hans!.id, role: 'organizer' },
    { eventId: richterIncorp!.id, personId: dmitri!.id, role: 'beneficiary' },
    // Night Owl donation
    { eventId: nightOwlDonation!.id, personId: elif!.id, role: 'recipient-manager' },
    // Davos meeting
    { eventId: davosMeeting!.id, personId: elif!.id, role: 'attendee' },
    { eventId: davosMeeting!.id, personId: sarah!.id, role: 'attendee' },
    // Istanbul cafe
    { eventId: cafeMeeting!.id, personId: mehmet!.id, role: 'organizer' },
    { eventId: cafeMeeting!.id, personId: dmitri!.id, role: 'attendee' },
    { eventId: cafeMeeting!.id, personId: ahmet!.id, role: 'attendee' },
    { eventId: cafeMeeting!.id, personId: kemal!.id, role: 'observer', notes: 'Informant. Reported meeting details.' },
    // Night Owl transfer
    { eventId: nightOwlTransfer!.id, personId: elif!.id, role: 'initiator' },
    { eventId: nightOwlTransfer!.id, personId: layla!.id, role: 'recipient' },
    // Art shipment
    { eventId: artShipment!.id, personId: ahmet!.id, role: 'shipper' },
    { eventId: artShipment!.id, personId: maria!.id, role: 'receiver' },
    // Berlin meeting
    { eventId: berlinMeeting!.id, personId: mehmet!.id, role: 'organizer' },
    { eventId: berlinMeeting!.id, personId: hans!.id, role: 'host' },
    { eventId: berlinMeeting!.id, personId: dmitri!.id, role: 'attendee' },
    // Cedar Gate payment
    { eventId: cedarPayment!.id, personId: layla!.id, role: 'initiator' },
    { eventId: cedarPayment!.id, personId: omar!.id, role: 'recipient' },
    // Customs clearance
    { eventId: customsClear!.id, personId: yusuf!.id, role: 'perpetrator' },
    // Erbil visit
    { eventId: erbilVisit!.id, personId: layla!.id, role: 'visitor' },
    { eventId: erbilVisit!.id, personId: omar!.id, role: 'host' },
    // Moscow cash
    { eventId: moscowCash!.id, personId: natasha!.id, role: 'perpetrator' },
    // Comms spike
    { eventId: commSpike!.id, personId: mehmet!.id, role: 'participant' },
    { eventId: commSpike!.id, personId: elif!.id, role: 'participant' },
    { eventId: commSpike!.id, personId: layla!.id, role: 'participant' },
  ]);

  // ─── EVENT-TO-ORG LINKS ───────────────────────────────

  await db.insert(eventToOrganization).values([
    { eventId: richterIncorp!.id, organizationId: richterLegal!.id, role: 'registrar' },
    { eventId: richterIncorp!.id, organizationId: volkovLogistics!.id, role: 'entity-created' },
    { eventId: nightOwlDonation!.id, organizationId: nightOwl!.id, role: 'recipient' },
    { eventId: nightOwlTransfer!.id, organizationId: nightOwl!.id, role: 'sender' },
    { eventId: nightOwlTransfer!.id, organizationId: cedarGate!.id, role: 'receiver' },
    { eventId: artShipment!.id, organizationId: istanbulTrade!.id, role: 'shipper' },
    { eventId: artShipment!.id, organizationId: europaArt!.id, role: 'receiver' },
    { eventId: cedarPayment!.id, organizationId: cedarGate!.id, role: 'payer' },
    { eventId: cedarPayment!.id, organizationId: alRashid!.id, role: 'payee' },
    { eventId: customsClear!.id, organizationId: istanbulTrade!.id, role: 'beneficiary' },
    { eventId: moscowCash!.id, organizationId: volkovLogistics!.id, role: 'account-holder' },
    { eventId: berlinMeeting!.id, organizationId: richterLegal!.id, role: 'venue' },
  ]);

  // ─── EVENT-TO-EVENT CHAINS ────────────────────────────

  await db.insert(eventToEvent).values([
    // The Night Owl donation enabled the later transfers
    { sourceEventId: nightOwlDonation!.id, targetEventId: nightOwlTransfer!.id, relationshipType: 'enabled', notes: 'Donation funds were later channeled through the transfer.' },
    // The transfer led to the Cedar Gate payment
    { sourceEventId: nightOwlTransfer!.id, targetEventId: cedarPayment!.id, relationshipType: 'led_to', notes: 'Funds from Night Owl transfer routed through Cedar Gate to Al-Rashid.' },
    // Berlin meeting preceded the customs clearance (new procedures discussed)
    { sourceEventId: berlinMeeting!.id, targetEventId: customsClear!.id, relationshipType: 'preceded', notes: 'New logistics procedures discussed at Berlin meeting. Customs clearance followed shortly after.' },
    // Cafe meeting related to art shipment (logistics coordination)
    { sourceEventId: cafeMeeting!.id, targetEventId: artShipment!.id, relationshipType: 'led_to', notes: 'Logistics for art shipment believed to have been coordinated at this meeting.' },
    // Erbil visit followed the Cedar Gate payment (verification)
    { sourceEventId: cedarPayment!.id, targetEventId: erbilVisit!.id, relationshipType: 'led_to', notes: 'Layla visited Erbil to verify fund receipt and coordinate next steps.' },
    // Comms spike related to multiple events
    { sourceEventId: erbilVisit!.id, targetEventId: commSpike!.id, relationshipType: 'related_to', notes: 'Comms spike occurred shortly after Erbil visit. Possible planning for next phase.' },
    // Richter incorporation enabled Berlin meeting
    { sourceEventId: richterIncorp!.id, targetEventId: berlinMeeting!.id, relationshipType: 'preceded', notes: 'Richter\'s creation of Volkov Logistics established the relationship that led to the Berlin strategy meeting.' },
  ]);

  // ─── Summary ──────────────────────────────────────────

  console.log('OPERATION CRESCENT — Seed completed\n');
  console.log('  People:              12');
  console.log('  Organizations:        9');
  console.log('  Events:              12');
  console.log('  Person-Person:       11');
  console.log('  Person-Org:          15');
  console.log('  Org-Org:              8');
  console.log('  Event-Person:        25');
  console.log('  Event-Org:           12');
  console.log('  Event-Event chains:   7');
  console.log('  ─────────────────────');
  console.log('  Total records:      111\n');

  await pool.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
