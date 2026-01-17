import sequelize from '../config/db.js';
import JobImage from '../models/jobImage.js';

const checkImage = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        const img = await JobImage.findOne({
            order: [['createdAt', 'DESC']]
        });

        if (!img) {
            console.log('❌ No images found in DB.');
        } else {
            console.log('--- Last Image ---');
            console.log('ID:', img.id);
            console.log('Job ID:', img.job_id);
            console.log('File Path:', img.file_path);
            console.log('File Name:', img.file_name);
            console.log('Type:', img.file_type);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkImage();
