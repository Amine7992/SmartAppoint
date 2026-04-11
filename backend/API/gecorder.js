const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const nodeGeocoder = require('node-geocoder');
const supabase = require('../config/supabase');

const geocoder = nodeGeocoder({ provider: 'openstreetmap' });

const TUNISIA_CITIES = [
    'Tunis',
    'Ariana',
    'Ben Arous',
    'Manouba',
    'Nabeul',
    'Zaghouan',
    'Bizerte',
    'Beja',
    'Jendouba',
    'Kef',
    'Siliana',
    'Sousse',
    'Monastir',
    'Mahdia',
    'Sfax',
    'Kairouan',
    'Kasserine',
    'Sidi Bouzid',
    'Gabes',
    'Medenine',
    'Tataouine',
    'Gafsa',
    'Tozeur',
    'Kebili',
    'Hammamet',
    'Kelibia',
    'Korba',
    'Moknine',
    'Ksour Essef',
    'Jemmal',
    'Menzel Temime',
    'Mateur',
    'Rades',
    'La Marsa',
    'Le Bardo',
    'Douz',
    'Metlaoui',
    'Chebba',
    'Kerkennah',
    'Djerba',
    'Houmt Souk',
    'Midoun',
    'Jarzis',
    'Zarzis',
    'Testour',
    'Tabarka',
    'Grombalia',
    'Ksar Hellal',
    'Akouda'
];

const coordinateCache = new Map();

function normalizeCityName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function normalizeAddress(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getResultCandidates(geocodeResult) {
    return [
        geocodeResult.city,
        geocodeResult.administrativeLevels?.level2long,
        geocodeResult.administrativeLevels?.level1long,
        geocodeResult.state,
        geocodeResult.county
    ]
        .filter(Boolean)
        .map(normalizeCityName);
}

function getAddressCandidates(geocodeResult) {
    return [
        geocodeResult.streetName,
        geocodeResult.extra?.neighborhood,
        geocodeResult.neighbourhood,
        geocodeResult.formattedAddress
    ]
        .filter(Boolean)
        .map(normalizeAddress);
}

function levenshteinDistance(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
        matrix[i][0] = i;
    }

    for (let j = 0; j < cols; j += 1) {
        matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[a.length][b.length];
}

function getSimilarityScore(inputCity, candidate) {
    const normalizedInput = normalizeCityName(inputCity);
    const normalizedCandidate = normalizeCityName(candidate);

    if (!normalizedInput || !normalizedCandidate) {
        return 0;
    }

    if (normalizedInput === normalizedCandidate) {
        return 1;
    }

    const distance = levenshteinDistance(normalizedInput, normalizedCandidate);
    const maxLength = Math.max(normalizedInput.length, normalizedCandidate.length);
    return 1 - distance / maxLength;
}

function isTunisiaResult(geocodeResult) {
    const country = normalizeCityName(geocodeResult.country);
    const countryCode = normalizeCityName(geocodeResult.countryCode);
    return country === 'tunisia' || country === 'tunisie' || countryCode === 'tn';
}

function findClosestTunisiaCity(inputCity) {
    let bestMatch = null;

    for (const city of TUNISIA_CITIES) {
        const score = getSimilarityScore(inputCity, city);
        if (!bestMatch || score > bestMatch.score) {
            bestMatch = { city, score };
        }
    }

    if (!bestMatch) {
        return null;
    }

    const normalizedInput = normalizeCityName(inputCity);
    const minScore = normalizedInput.length <= 5 ? 0.88 : 0.62;
    return bestMatch.score >= minScore ? bestMatch.city : null;
}

function findBestTunisiaMatch(inputCity, results) {
    const tunisiaResults = results.filter(isTunisiaResult);

    if (tunisiaResults.length === 1) {
        return tunisiaResults[0];
    }

    let bestMatch = null;

    for (const result of tunisiaResults) {
        const candidates = getResultCandidates(result);
        let bestScoreForResult = 0;

        for (const candidate of candidates) {
            const score = getSimilarityScore(inputCity, candidate);
            if (score > bestScoreForResult) {
                bestScoreForResult = score;
            }
        }

        if (!bestMatch || bestScoreForResult > bestMatch.score) {
            bestMatch = { result, score: bestScoreForResult };
        }
    }

    if (!bestMatch) {
        return null;
    }

    const normalizedInput = normalizeCityName(inputCity);
    const minScore = normalizedInput.length <= 5 ? 0.9 : 0.72;
    if (bestMatch.score >= minScore) {
        return bestMatch.result;
    }

    return tunisiaResults[0] || null;
}

function findBestTunisiaAddressMatch(inputAddress, canonicalCity, results) {
    const normalizedAddress = normalizeAddress(inputAddress);
    const normalizedCity = normalizeCityName(canonicalCity);
    const tunisiaResults = results.filter((result) => {
        if (!isTunisiaResult(result)) {
            return false;
        }

        const cityCandidates = getResultCandidates(result);
        return cityCandidates.includes(normalizedCity);
    });

    let bestMatch = null;

    for (const result of tunisiaResults) {
        const addressCandidates = getAddressCandidates(result);
        let bestScoreForResult = 0;

        for (const candidate of addressCandidates) {
            const score = getSimilarityScore(normalizedAddress, candidate);
            if (score > bestScoreForResult) {
                bestScoreForResult = score;
            }
        }

        if (!bestMatch || bestScoreForResult > bestMatch.score) {
            bestMatch = { result, score: bestScoreForResult };
        }
    }

    if (!bestMatch) {
        return null;
    }

    const minScore = normalizedAddress.length <= 8 ? 0.86 : 0.68;
    return bestMatch.score >= minScore ? bestMatch.result : null;
}

async function resolveTunisiaCoordinates(city, address) {
    if (!city) {
        return { lat: 0, lon: 0, canonicalCity: null };
    }

    const canonicalCity = findClosestTunisiaCity(city);
    if (!canonicalCity) {
        return { lat: 0, lon: 0, canonicalCity: null };
    }

    const cacheKey = `${normalizeCityName(canonicalCity)}::${normalizeAddress(address)}`;
    if (coordinateCache.has(cacheKey)) {
        return coordinateCache.get(cacheKey);
    }

    let bestMatch = null;

    if (address) {
        const addressResults = await geocoder.geocode(`${address}, ${canonicalCity}, Tunisia`);
        bestMatch = findBestTunisiaAddressMatch(address, canonicalCity, addressResults);
    }

    if (!bestMatch) {
        const cityResults = await geocoder.geocode(`${canonicalCity}, Tunisia`);
        bestMatch = findBestTunisiaMatch(canonicalCity, cityResults);
    }

    const resolved = bestMatch
        ? {
            lat: Number(bestMatch.latitude) || 0,
            lon: Number(bestMatch.longitude) || 0,
            canonicalCity
        }
        : { lat: 0, lon: 0, canonicalCity };

    coordinateCache.set(cacheKey, resolved);
    return resolved;
}

async function enrichProfileWithCoordinates(profile) {
    const coordinates = await resolveTunisiaCoordinates(profile.city, profile.adresse);
    return {
        ...profile,
        city: coordinates.canonicalCity || profile.city,
        lat: coordinates.lat,
        lon: coordinates.lon
    };
}

async function updateAllUsers() {
    console.log('Demarrage de la mise a jour des coordonnees...');

    const { data: users, error: selectError } = await supabase
        .from('utilisateur')
        .select('id, city, adresse, lat, lon');

    if (selectError) {
        console.error('Erreur lors de la recuperation :', selectError.message);
        return;
    }

    if (users.length === 0) {
        console.log('Aucun utilisateur a mettre a jour.');
        return;
    }

    for (const user of users) {
        try {
            const coordinates = await resolveTunisiaCoordinates(user.city, user.adresse);
            const nextLat = coordinates.lat;
            const nextLon = coordinates.lon;

            const hasCoordinates =
                user.lat !== null &&
                user.lat !== undefined &&
                user.lon !== null &&
                user.lon !== undefined;

            const sameLatitude = hasCoordinates && Math.abs(Number(user.lat) - nextLat) < 0.000001;
            const sameLongitude = hasCoordinates && Math.abs(Number(user.lon) - nextLon) < 0.000001;

            if (sameLatitude && sameLongitude) {
                console.log(`Aucun changement pour ${user.city || 'ville inconnue'}.`);
                continue;
            }

            const { error: updateError } = await supabase
                .from('utilisateur')
                .update({
                    city: coordinates.canonicalCity || user.city,
                    lat: nextLat,
                    lon: nextLon
                })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            console.log(`Succes : ${user.city} -> ${coordinates.canonicalCity} -> ${nextLat}, ${nextLon}`);
            await new Promise((resolve) => setTimeout(resolve, 1100));
        } catch (error) {
            console.error(`Erreur pour ${user.city}:`, error.message);
        }
    }

    console.log('Migration terminee !');
}

module.exports = {
    enrichProfileWithCoordinates,
    findClosestTunisiaCity,
    normalizeCityName,
    resolveTunisiaCoordinates,
    updateAllUsers
};

if (require.main === module) {
    updateAllUsers().catch((error) => {
        console.error('Erreur fatale geocoder:', error);
        process.exitCode = 1;
    });
}
