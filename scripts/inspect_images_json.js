import sequelize from '../config/db.js';
import JobImage from '../models/jobImage.js';

const inspectImages = async () => {
    try {
        await sequelize.authenticate();

        const images = await JobImage.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        const dump = images.map(img => ({
            id: img.id,
            type: img.file_type,
            path: img.file_path
        }));

        console.log("JSON_DUMP_START");
        console.log(JSON.stringify(dump, null, 2));
        console.log("JSON_DUMP_END");

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectImages();
