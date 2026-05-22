const axios = require('axios');

const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY || '';

const searchMedicines = async (req, res) => {
    const { name, page = 1 } = req.query;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({
            status: "ERROR",
            message: "Search term must be at least 2 characters long"
        });
    }

    try {
        const searchTerm = name.trim();

        const params = {
            search: `active_ingredient:"${searchTerm}" OR generic_name:"${searchTerm}" OR brand_name:"${searchTerm}"`,
            limit: 10,
            skip: (parseInt(page) - 1) * 10,
            sort: 'effective_time:desc'
        };

        if (OPENFDA_API_KEY) {
            params.api_key = OPENFDA_API_KEY;
        }

        const response = await axios.get('https://api.fda.gov/drug/label.json', { params });

        const results = response.data.results || [];

        const medicines = results.map(med => {
            let displayName = 'Unknown';
            let genericName = '';
            let manufacturer = 'N/A';
            let purpose = 'N/A';
            let dosage = '';

            // Extract brand name from openfda
            if (med.openfda?.brand_name?.[0]) {
                displayName = med.openfda.brand_name[0];
            }
            // Fallback to generic name
            else if (med.openfda?.generic_name?.[0]) {
                genericName = med.openfda.generic_name[0];
                displayName = genericName;
            }
            // Fallback to active_ingredient (clean it up)
            else if (med.active_ingredient?.[0]) {
                const raw = med.active_ingredient[0];
                // Clean up: "Active ingredient Paracetamol 160 mg" -> "Paracetamol 160 mg"
                displayName = raw.replace(/^active ingredient\s*/i, '').replace(/^Active Ingrdient\s*/i, '').trim();
                genericName = displayName;
            }
            // Last fallback: use product data elements
            else if (med.spl_product_data_elements?.[0]) {
                displayName = med.spl_product_data_elements[0].substring(0, 100);
            }

            if (med.openfda?.manufacturer_name?.[0]) {
                manufacturer = med.openfda.manufacturer_name[0];
            }

            if (med.purpose?.[0]) {
                purpose = med.purpose[0].substring(0, 150);
            }

            // Extract dosage info
            if (med.dosage_and_administration?.[0]) {
                dosage = med.dosage_and_administration[0].substring(0, 200);
            }

            return {
                id: med.id,
                display_name: displayName,
                generic_name: genericName,
                manufacturer: manufacturer,
                purpose: purpose,
                dosage: dosage
            };
        });

        res.json({
            status: "SUCCESS",
            count: response.data.meta?.results?.total || 0,
            page: parseInt(page),
            medicines: medicines
        });

    } catch (error) {
        console.error('OpenFDA API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: "ERROR",
            message: error.response?.data?.error?.message || "Failed to fetch medicines."
        });
    }
};

module.exports = { searchMedicines };