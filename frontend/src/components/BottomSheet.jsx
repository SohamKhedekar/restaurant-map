import "./BottomSheet.css";

export default function BottomSheet({ open, onClose, hotspot }) {
    return (
        <div className={`sheet ${open ? "open" : ""}`}>
            <div className="backdrop" onClick={onClose} />

            <div className="panel">
                {hotspot ? (
                    <>
                        <h2>{hotspot.name}</h2>
                        <p>{hotspot.description}</p>
                    </>
                ) : (
                    <p>No hotspot found for this city.</p>
                )}
            </div>
        </div>
    );
}
