
const data = [
    { id: 1, name: 'John Doe', age: 25, address: '123 Main St', location: { la: 40.7128, lo: -74.0060 } },
    { id: 2, name: 'Tom Smith', age: 32, address: '456 Elm St', location: { la: 34.0522, lo: -118.2437 } },
    { id: 3, name: 'Jane Brown', age: 45, address: '789 Cedar St', location: { la: 41.8781, lo: -87.6298 } },
    { id: 4, name: 'Mary White', age: 19, address: '101 Pine St', location: { la: 29.7604, lo: -95.3698 } },
    { id: 5, name: 'Mike Black', age: 22, address: '202 Oak St', location: { la: 33.4484, lo: -112.0740 } },
    { id: 6, name: 'Sue Green', age: 28, address: '303 Birch St', location: { la: 39.7392, lo: -104.9903 } },
]

const Name = ({ name }) => <span class="text-bold text-blue text-underline" onClick={() => alert(name)}>{name}</span>
const Age = ({ age }) => <span class="text-bold text-red">{age}</span>
const Address = ({ address }) => <span class="text-bold text-green">{address}</span>

function MapCanvas() {
    return (
        <div class="map-canvas">
            <div class="map-marker" style={{ top: '40%', left: '50%' }}></div>
        </div>
    )
}
