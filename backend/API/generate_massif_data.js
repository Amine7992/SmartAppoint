const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { faker } = require('@faker-js/faker');
const supabase = require('../config/supabase');
const { enrichProfileWithCoordinates } = require('./gecorder');

const CONFIG = {
    newProfessionals: Number(process.env.SEED_NEW_PROFESSIONALS || 40),
    newClients: Number(process.env.SEED_NEW_CLIENTS || 80),
    targetServicesPerProfessional: Number(process.env.SEED_SERVICES_PER_PRO || 12),
    targetAppointments: Number(process.env.SEED_TARGET_APPOINTMENTS || 1000000),
    appointmentBatchSize: Number(process.env.SEED_APPOINTMENT_BATCH_SIZE || 1000),
    authDelayMs: Number(process.env.SEED_AUTH_DELAY_MS || 1200),
    authMaxRetries: Number(process.env.SEED_AUTH_MAX_RETRIES || 4),
    emailPrefix: process.env.SEED_EMAIL_PREFIX || 'seedia',
    emailDomain: process.env.SEED_EMAIL_DOMAIN || 'gmail.com',
    defaultPassword: process.env.SEED_DEFAULT_PASSWORD || 'Seed123456!',
    geocodeDelayMs: Number(process.env.SEED_GEOCODE_DELAY_MS || 1100)
};

const TUNISIAN_CITIES = [
    'Tunis', 'Ariana', 'Ben Arous', 'La Marsa', 'Manouba', 'Nabeul', 'Hammamet', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Gabes', 'Medenine', 'Djerba', 'Bizerte',
    'Gafsa', 'Tozeur', 'Kasserine', 'Sidi Bouzid'
];

const TUNISIAN_STREETS = [
    'Rue Habib Bourguiba',
    'Avenue de la Republique',
    'Rue Ibn Khaldoun',
    'Rue 14 Janvier',
    'Avenue Farhat Hached',
    'Rue Mongi Slim',
    'Rue de la Liberte',
    'Avenue de l Environnement',
    'Rue Tahar Sfar',
    'Avenue Hedi Chaker',
    'Rue Ali Belhouane',
    'Avenue des Martyrs'
];

const TUNISIAN_FIRST_NAMES = [
    'Mohamed', 'Ahmed', 'Sami', 'Yassine', 'Walid', 'Karim', 'Amine', 'Fares', 'Bilel', 'Hatem',
    'Marwa', 'Ons', 'Sarra', 'Imen', 'Rim', 'Asma', 'Amina', 'Meriem', 'Nour', 'Hadil'
];

const TUNISIAN_LAST_NAMES = [
    'Ben Ali', 'Trabelsi', 'Jlassi', 'Abid', 'Gharbi', 'Mansouri', 'Kefi', 'Chaari', 'Masmoudi', 'Ayadi',
    'Haddad', 'Ben Salem', 'Siala', 'Miled', 'Khlifi', 'Mokni', 'Bouazizi', 'Hamdi', 'Zitouni', 'Baccar'
];

const PROFESSIONAL_PROFILES = [
    ['Medecin generaliste', 'Consultations, suivi preventif et orientation des patients.'],
    ['Dentiste', 'Soins courants, prevention bucco-dentaire, detartrage et traitements des caries.'],
    ['Avocat', 'Accompagnement juridique, conseil et redaction de dossiers.'],
    ['Comptable', 'Tenue comptable, fiscalite, bilans et declarations administratives.'],
    ['Architecte', 'Conception de plans, renovation et suivi de projets immobiliers.'],
    ['Professeur de mathematiques', 'Soutien scolaire, remise a niveau et preparation aux examens.'],
    ['Professeur de francais', 'Expression ecrite, orale, soutien scolaire et preparation aux examens.'],
    ['Plombier', 'Installation sanitaire, maintenance, reparation de fuites et depannage rapide.'],
    ['Kinesitherapeute', 'Reeducation fonctionnelle, suivi post-traumatique et seances de remise en forme.'],
    ['Infirmier', 'Soins a domicile, suivi medical de base et accompagnement des patients chroniques.']
];

const SERVICE_TEMPLATES = [
    ['Consultation Express', 'Prise en charge rapide pour besoin ponctuel.', 20, 25, 60],
    ['Service Standard', 'Prestation standard avec diagnostic et recommandations.', 45, 50, 120],
    ['Accompagnement Premium', 'Prestation approfondie avec suivi detaille.', 90, 100, 280],
    ['Suivi Personnalise', 'Seance de suivi adaptee a la situation du client.', 35, 40, 90],
    ['Bilan Complet', 'Evaluation complete avec compte-rendu detaille.', 70, 80, 220],
    ['Intervention Prioritaire', 'Prise en charge prioritaire sur rendez-vous.', 30, 60, 150],
    ['Diagnostic Avance', 'Analyse plus poussee pour les besoins complexes.', 55, 70, 180],
    ['Seance Expert', 'Seance reservee aux cas exigeant une expertise metier renforcee.', 75, 90, 240],
    ['Pack Conseils', 'Pack de conseils structures pour suivi cible.', 50, 55, 130],
    ['Suivi Long Terme', 'Accompagnement de suivi sur une problematique recurrente.', 60, 65, 170],
    ['Session Intensive', 'Session plus dense reservee aux cas urgents.', 80, 95, 260],
    ['Controle Qualite', 'Controle final et recommandations de continuation.', 25, 30, 80]
];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function roundTo(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function pickWeighted(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let threshold = Math.random() * totalWeight;

    for (const item of items) {
        threshold -= item.weight;
        if (threshold <= 0) {
            return item.value;
        }
    }

    return items[items.length - 1].value;
}

function randomCity() {
    return faker.helpers.arrayElement(TUNISIAN_CITIES);
}

function generateTunisianCin() {
    return faker.string.numeric({ length: 8, allowLeadingZeros: false });
}

function generateTunisianPhone() {
    const prefixes = ['2', '4', '5', '7', '9'];
    return `${faker.helpers.arrayElement(prefixes)}${faker.string.numeric({ length: 7, allowLeadingZeros: true })}`;
}

function generateTunisianAddress(city) {
    const street = faker.helpers.arrayElement(TUNISIAN_STREETS);
    const number = faker.number.int({ min: 1, max: 120 });
    return `${street} ${number}, ${city}`;
}

function generateAccountCreatedAt() {
    return faker.date.between({
        from: '2021-01-01T00:00:00.000Z',
        to: '2025-12-31T23:59:59.000Z'
    }).toISOString();
}

function hasValidCoordinates(lat, lon) {
    return Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!hasValidCoordinates(lat1, lon1) || !hasValidCoordinates(lat2, lon2)) {
        return 50;
    }

    const R = 6371;
    const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
    const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function buildUserProfile(role, sequence) {
    const firstName = faker.helpers.arrayElement(TUNISIAN_FIRST_NAMES);
    const lastName = faker.helpers.arrayElement(TUNISIAN_LAST_NAMES);
    const city = randomCity();
    const email = [
        CONFIG.emailPrefix,
        role === 'professional' ? 'pro' : 'client',
        slugify(firstName),
        slugify(lastName),
        Date.now(),
        sequence
    ].join('.') + `@${CONFIG.emailDomain}`;

    const profile = {
        nom: lastName,
        prenom: firstName,
        email,
        phone: generateTunisianPhone(),
        cin: generateTunisianCin(),
        city,
        adresse: generateTunisianAddress(city),
        is_active: true,
        created_at: generateAccountCreatedAt(),
        lat: null,
        lon: null,
        role
    };

    if (role === 'professional') {
        const [specialite, description] = faker.helpers.arrayElement(PROFESSIONAL_PROFILES);
        profile.specialite = specialite;
        profile.description = `${description} Base a ${city}, Tunisie.`;
        profile.validation = 'a valider';
    } else {
        profile.specialite = null;
        profile.description = null;
    }

    return profile;
}

function buildClientBehavior(client) {
    return {
        clientId: client.id,
        bookingWeight: faker.number.int({ min: 2, max: 16 }),
        baseReliability: faker.number.float({ min: 0.35, max: 0.97, fractionDigits: 2 }),
        generosityBase: faker.number.float({ min: 2, max: 5, fractionDigits: 2 }),
        generosityVariance: faker.number.float({ min: 0.2, max: 1.1, fractionDigits: 2 }),
        cancellationRate: faker.number.float({ min: 0.01, max: 0.25, fractionDigits: 2 }),
        noShowRate: faker.number.float({ min: 0.01, max: 0.18, fractionDigits: 2 }),
        loyaltyWeight: faker.number.float({ min: 0.5, max: 1.8, fractionDigits: 2 }),
        punctualityBias: faker.number.float({ min: -0.08, max: 0.12, fractionDigits: 2 }),
        longDelayTolerance: faker.number.float({ min: -0.12, max: 0.08, fractionDigits: 2 }),
        distanceTolerance: faker.number.float({ min: -0.16, max: 0.10, fractionDigits: 2 }),
        prefersNearbyProfessionals: faker.datatype.boolean({ probability: 0.72 })
    };
}

function buildProfessionalBehavior(professional) {
    return {
        professionalId: professional.id,
        popularityWeight: faker.number.int({ min: 2, max: 12 }),
        strictnessWeight: faker.number.float({ min: -0.4, max: 0.8, fractionDigits: 2 }),
        premiumBias: faker.number.float({ min: -0.15, max: 0.25, fractionDigits: 2 }),
        scheduleDiscipline: faker.number.float({ min: -0.05, max: 0.10, fractionDigits: 2 }),
        cancellationProtection: faker.number.float({ min: -0.05, max: 0.12, fractionDigits: 2 })
    };
}

function createClientState(client) {
    return {
        clientId: client.id,
        totalAppointments: 0,
        attendedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        cumulativeRating: 0
    };
}

function buildDeterministicNoise(seed) {
    let hash = 0;
    const normalizedSeed = String(seed || '');

    for (let index = 0; index < normalizedSeed.length; index += 1) {
        hash = ((hash << 5) - hash) + normalizedSeed.charCodeAt(index);
        hash |= 0;
    }

    return ((Math.abs(hash) % 1000) / 1000) - 0.5;
}

async function fetchUsersByRole(role) {
    const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('role', role);

    if (error) {
        throw error;
    }

    return data || [];
}

async function fetchAllServices() {
    const { data, error } = await supabase
        .from('Service')
        .select('*');

    if (error) {
        throw error;
    }

    return data || [];
}

async function createAuthUser(profile) {
    let lastError = null;
    const canUseAdminApi = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    for (let attempt = 1; attempt <= CONFIG.authMaxRetries; attempt += 1) {
        const authCall = canUseAdminApi
            ? supabase.auth.admin.createUser({
                email: profile.email,
                password: CONFIG.defaultPassword,
                email_confirm: true,
                user_metadata: {
                    role: profile.role,
                    prenom: profile.prenom,
                    nom: profile.nom
                }
            })
            : supabase.auth.signUp({
                email: profile.email,
                password: CONFIG.defaultPassword,
                options: {
                    data: {
                        role: profile.role,
                        prenom: profile.prenom,
                        nom: profile.nom
                    }
                }
            });

        const { data, error } = await authCall;

        if (!error && data?.user?.id) {
            return data.user;
        }

        lastError = error || new Error('Creation utilisateur auth invalide.');
        await sleep(CONFIG.authDelayMs * attempt);
    }

    throw lastError;
}

async function createNewUsers(role, count, startSequence = 0) {
    const createdUsers = [];

    for (let index = 0; index < count; index += 1) {
        const sequence = startSequence + index + 1;
        const rawProfile = buildUserProfile(role, sequence);
        const profile = await enrichProfileWithCoordinates(rawProfile);
        const authUser = await createAuthUser(profile);
        const row = {
            ...profile,
            id: authUser.id
        };

        const { data, error } = await supabase
            .from('utilisateur')
            .insert([row])
            .select()
            .single();

        if (error) {
            throw error;
        }

        createdUsers.push(data);
        console.log(`${role} cree: ${data.email} (${data.city}) -> ${data.lat}, ${data.lon}`);
        await sleep(CONFIG.geocodeDelayMs);
    }

    return createdUsers;
}

function buildServicePayload(professional, templateIndex) {
    const [name, description, duration, minPrice, maxPrice] = SERVICE_TEMPLATES[templateIndex % SERVICE_TEMPLATES.length];
    return {
        nom: `${name} - ${professional.specialite || 'Service'}`,
        description: `${description} Professionnel: ${professional.prenom} ${professional.nom}.`,
        duree_minutes: duration,
        prix: faker.number.int({ min: minPrice, max: maxPrice }),
        professional_id: professional.id
    };
}

async function ensureServicesForProfessionals(professionals) {
    const existingServices = await fetchAllServices();
    const servicesByProfessional = new Map();

    for (const service of existingServices) {
        if (!servicesByProfessional.has(service.professional_id)) {
            servicesByProfessional.set(service.professional_id, []);
        }
        servicesByProfessional.get(service.professional_id).push(service);
    }

    for (const professional of professionals) {
        const currentServices = servicesByProfessional.get(professional.id) || [];
        const missingCount = Math.max(0, CONFIG.targetServicesPerProfessional - currentServices.length);

        if (missingCount === 0) {
            continue;
        }

        const payload = Array.from({ length: missingCount }, (_, index) =>
            buildServicePayload(professional, currentServices.length + index)
        );

        const { data, error } = await supabase
            .from('Service')
            .insert(payload)
            .select('*');

        if (error) {
            throw error;
        }

        servicesByProfessional.set(professional.id, [...currentServices, ...(data || [])]);
        console.log(`${data?.length || 0} services ajoutes pour ${professional.email}`);
    }

    return fetchAllServices();
}

function buildAppointmentPayload(service, clientBehavior, professionalBehavior, clientProfile, professionalProfile, clientState) {
    const createdAt = faker.date.between({ from: '2022-01-01', to: '2026-03-01' });
    const delayDays = faker.number.int({ min: 1, max: 45 });
    const appointmentDate = new Date(createdAt);
    appointmentDate.setDate(appointmentDate.getDate() + delayDays);

    const distanceKm = calculateDistance(
        clientProfile.lat,
        clientProfile.lon,
        professionalProfile.lat,
        professionalProfile.lon
    );

    const accountAgeDays = Math.max(
        1,
        Math.round((createdAt.getTime() - new Date(clientProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    const priorAppointments = clientState.totalAppointments;
    const attendanceRatio = priorAppointments > 0
        ? clientState.attendedAppointments / priorAppointments
        : clientBehavior.baseReliability;
    const cancellationRatio = priorAppointments > 0
        ? clientState.cancelledAppointments / priorAppointments
        : clientBehavior.cancellationRate;
    const noShowRatio = priorAppointments > 0
        ? clientState.noShowAppointments / priorAppointments
        : clientBehavior.noShowRate;
    const historicalRating = clientState.attendedAppointments > 0
        ? clientState.cumulativeRating / clientState.attendedAppointments
        : clientBehavior.generosityBase;

    let presenceProbability = clientBehavior.baseReliability * 0.45 + attendanceRatio * 0.55;

    if (distanceKm > 120) {
        presenceProbability -= 0.26;
    } else if (distanceKm > 60) {
        presenceProbability -= 0.16;
    } else if (distanceKm > 25) {
        presenceProbability -= 0.08;
    } else if (distanceKm < 8) {
        presenceProbability += 0.05;
    }

    if (accountAgeDays < 45) {
        presenceProbability -= 0.18;
    } else if (accountAgeDays < 120) {
        presenceProbability -= 0.08;
    } else if (accountAgeDays > 800) {
        presenceProbability += 0.04;
    }

    if (delayDays > 30) {
        presenceProbability -= 0.18 + Math.max(0, -clientBehavior.longDelayTolerance);
    } else if (delayDays > 15) {
        presenceProbability -= 0.07 + Math.max(0, -clientBehavior.longDelayTolerance * 0.5);
    }

    if (clientBehavior.prefersNearbyProfessionals && distanceKm > 25) {
        presenceProbability -= 0.10;
    }

    if ((professionalProfile.city || '').toLowerCase() === (clientProfile.city || '').toLowerCase()) {
        presenceProbability += 0.06;
    }

    presenceProbability -= cancellationRatio * 0.22;
    presenceProbability -= noShowRatio * 0.30;
    presenceProbability += (historicalRating - 3) * 0.04;
    presenceProbability += clientBehavior.punctualityBias;
    presenceProbability += clientBehavior.distanceTolerance;
    presenceProbability += professionalBehavior.scheduleDiscipline;
    presenceProbability += professionalBehavior.cancellationProtection;

    const noise = buildDeterministicNoise(`${clientProfile.id}:${professionalProfile.id}:${service.id}:${delayDays}:${accountAgeDays}`) * 0.10;
    presenceProbability = clamp(presenceProbability + noise, 0.03, 0.98);

    const riskScore = clamp(1 - presenceProbability, 0.02, 0.97);
    const cancellationThreshold = clamp(0.38 + cancellationRatio * 0.35 + clientBehavior.cancellationRate * 0.35, 0.25, 0.78);
    const noShowThreshold = clamp(0.63 + noShowRatio * 0.22 + clientBehavior.noShowRate * 0.30 + (distanceKm > 80 ? 0.06 : 0), 0.45, 0.92);

    let status = 'past';

    if (riskScore >= noShowThreshold) {
        status = 'no_show';
    } else if (riskScore >= cancellationThreshold) {
        status = 'cancelled';
    }

    const rawRating = clientBehavior.generosityBase +
        faker.number.float({
            min: -clientBehavior.generosityVariance,
            max: clientBehavior.generosityVariance,
            fractionDigits: 2
        }) -
        professionalBehavior.strictnessWeight +
        (status === 'past' ? 0.15 : -0.1);

    const rating = status === 'past'
        ? clamp(Math.round(rawRating), 1, 5)
        : null;

    return {
        id: faker.string.uuid(),
        client_id: clientProfile.id,
        professional_id: professionalProfile.id,
        service_id: service.id,
        date_heure: appointmentDate.toISOString(),
        status,
        payment_status: status === 'past' ? 'paid' : 'unpaid',
        rating,
        created_at: createdAt.toISOString(),
        no_show_probability: Math.round(riskScore * 100),
        distance_km: roundTo(distanceKm, 2),
        client_historical_attendance_rate: roundTo(attendanceRatio, 3),
        client_historical_cancellation_rate: roundTo(cancellationRatio, 3),
        client_historical_no_show_rate: roundTo(noShowRatio, 3),
        booking_delay_days: delayDays,
        account_age_days: accountAgeDays
    };
}

function updateClientState(clientState, appointmentPayload) {
    clientState.totalAppointments += 1;

    if (appointmentPayload.status === 'past') {
        clientState.attendedAppointments += 1;
        clientState.cumulativeRating += appointmentPayload.rating || 0;
        return;
    }

    if (appointmentPayload.status === 'cancelled') {
        clientState.cancelledAppointments += 1;
        return;
    }

    if (appointmentPayload.status === 'no_show') {
        clientState.noShowAppointments += 1;
    }
}

function toAppointmentInsertRow(appointmentPayload) {
    return {
        id: appointmentPayload.id,
        client_id: appointmentPayload.client_id,
        professional_id: appointmentPayload.professional_id,
        service_id: appointmentPayload.service_id,
        date_heure: appointmentPayload.date_heure,
        status: appointmentPayload.status,
        payment_status: appointmentPayload.payment_status,
        rating: appointmentPayload.rating,
        created_at: appointmentPayload.created_at,
        no_show_probability: appointmentPayload.no_show_probability
    };
}

function buildServiceAffinity(client, clientBehavior, service, professional, professionalBehavior) {
    const distanceKm = calculateDistance(client.lat, client.lon, professional.lat, professional.lon);
    let weight = 1;

    if ((client.city || '').toLowerCase() === (professional.city || '').toLowerCase()) {
        weight += 4.5;
    }

    if (distanceKm <= 5) {
        weight += 6;
    } else if (distanceKm <= 15) {
        weight += 4;
    } else if (distanceKm <= 40) {
        weight += 2.5;
    } else if (distanceKm <= 90) {
        weight += 1;
    } else {
        weight -= 0.6;
    }

    const servicePrice = Number(service.prix) || 0;
    if (servicePrice <= 70) {
        weight += 0.8;
    } else if (servicePrice >= 180) {
        weight += professionalBehavior.premiumBias;
    }

    weight += clientBehavior.bookingWeight * 0.35;
    weight += clientBehavior.loyaltyWeight * 0.9;
    weight += professionalBehavior.popularityWeight * 0.25;

    return clamp(weight, 0.2, 30);
}

async function generateMassiveData() {
    console.log('Lancement du seed massif...');

    const existingProfessionals = await fetchUsersByRole('professional');
    const existingClients = await fetchUsersByRole('client');

    const newProfessionals = await createNewUsers('professional', CONFIG.newProfessionals, existingProfessionals.length);
    const newClients = await createNewUsers('client', CONFIG.newClients, existingClients.length);

    const professionals = [...existingProfessionals, ...newProfessionals];
    const clients = [...existingClients, ...newClients];

    const services = await ensureServicesForProfessionals(professionals);
    const proMap = new Map(professionals.map((professional) => [professional.id, professional]));
    const proBehaviors = new Map(professionals.map((professional) => [professional.id, buildProfessionalBehavior(professional)]));
    const clientProfiles = clients.map((client) => ({
        ...client,
        behavior: buildClientBehavior(client)
    }));
    const clientStates = new Map(clientProfiles.map((client) => [client.id, createClientState(client)]));

    let inserted = 0;

    while (inserted < CONFIG.targetAppointments) {
        const batch = [];
        const remaining = CONFIG.targetAppointments - inserted;
        const batchTarget = Math.min(CONFIG.appointmentBatchSize, remaining);

        for (let index = 0; index < batchTarget; index += 1) {
            const client = pickWeighted(
                clientProfiles.map((profile) => ({
                    value: profile,
                    weight: profile.behavior.bookingWeight
                }))
            );

            const weightedServices = services
                .map((service) => {
                    const professional = proMap.get(service.professional_id);
                    if (!professional) {
                        return null;
                    }

                    const professionalBehavior = proBehaviors.get(professional.id);
                    return {
                        value: { service, professional, professionalBehavior },
                        weight: buildServiceAffinity(client, client.behavior, service, professional, professionalBehavior)
                    };
                })
                .filter(Boolean);

            if (!weightedServices.length) {
                continue;
            }

            const { service, professional, professionalBehavior } = pickWeighted(weightedServices);
            const clientState = clientStates.get(client.id);
            const appointmentPayload = buildAppointmentPayload(
                service,
                client.behavior,
                professionalBehavior,
                client,
                professional,
                clientState
            );
            updateClientState(clientState, appointmentPayload);
            batch.push(appointmentPayload);
        }

        if (!batch.length) {
            throw new Error('Aucun rendez-vous generable. Verifiez les utilisateurs et services disponibles.');
        }

        const { error } = await supabase
            .from('Appointment')
            .insert(batch.map(toAppointmentInsertRow));

        if (error) {
            throw error;
        }

        inserted += batch.length;
        console.log(`Progression: ${inserted}/${CONFIG.targetAppointments}`);
    }
}

generateMassiveData().catch((error) => {
    console.error('Erreur generate_massif_data:', error);
    process.exitCode = 1;
});
