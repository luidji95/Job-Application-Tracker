
import "./css/companyCard.css";
import type { JobType } from "./StageColumn";
 

type StatusVariant = 'active' | 'accepted' | 'rejected';

type CompanyCardProps = JobType & {
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, newStatus: StatusVariant) => void;
}




const getCompanyColor = (name: string) => {
    const colors = [
        '#4f46e5', '#08ecd9', '#059669', 
        '#d97706', '#3b82f6', '#ef4444',
        '#0e8cc7', '#e91780', '#dcff13'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];

}

const getCompanyInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const CompanyCard = ({
    id,
    companyName, 
    position, 
    appliedDate, 
    location, 
    stage, 
    salary, 
    tags = [],
    status
}: CompanyCardProps) => {
    return (
        <div className={`company_card company_card--${status}`} data-id={id}>
            <div className='company_card_header'>
                <div className='company_card_info'>
                    <div className="company_card_avatar" style={{backgroundColor: getCompanyColor(companyName)}}>
                        {getCompanyInitials(companyName)}
                    </div>
                    <h4>{companyName}</h4>
                    <p>{position}</p>
                    {location && (
                        <p>📍 {location}</p>
                    )}
                </div>

                <div className='company_card_menu'>
                    <button className='menu_btn'>⋯</button>
                </div>
            </div>

            <div className='company_card_details'>
                <div className='details_item'>
                    <span className='detail_label'>Applied:</span>
                    <span className='detail_value'>
                        {new Date(appliedDate).toLocaleDateString()}
                    </span>
                </div>

                <div className='details_item'>
                    <span className='detail_label'>Stage:</span>
                    <span className='detail_value'>{stage}</span>
                </div>

                {salary && (
                    <div className='details_item'>
                        <span className='detail_label'>Salary:</span>
                        <span className='detail_value'>{salary}</span>
                    </div>
                )}

                {tags.length > 0 && (
                    <div className='company_card_tags'>
                        {tags.map((tag) => (
                            <span key={tag} className='company_card_tag'>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className='company_card_footer'>
                    <span className={`company_card_status company_card_status--${status}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
            </div>
        </div>
    )
}