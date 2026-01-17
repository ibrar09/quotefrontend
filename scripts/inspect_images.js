import sequelize from '../config/db.js';
import JobImage from '../models/jobImage.js';

const inspectImages = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        const images = await JobImage.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        if (images.length === 0) {
            console.log('❌ No images found.');
        } else {
            console.log(`--- Found ${images.length} images ---`);
            images.forEach(img => {
                console.log(`[${img.id}] Type: ${img.file_type} | Path: ${img.file_path}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectImages();
