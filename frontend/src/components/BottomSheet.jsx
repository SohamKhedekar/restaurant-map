import "./BottomSheet.css";

export default function BottomSheet({ open, onClose, restaurant }) {
    const info = restaurant?.data;
    return (
        <div className={`sheet ${open ? "open" : ""}`}>
            <div className="backdrop" onClick={onClose} />

            <div className="panel">
                {restaurant ? (
                    <>
                        <h2>{info.restaurant}</h2>
                        <p>{info.description}</p>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}
