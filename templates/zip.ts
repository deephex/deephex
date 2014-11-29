///<reference path="../editor.ts" />
///<reference path="../utils.ts" />
///<reference path="../tools.ts" />
///<reference path="../analyzer.ts" />

var DOS_TIME_ValueRepresenter = new ValueRepresenter((dostime: number) => {
    var hour = (dostime >>> 11) & 0x1f;
    var min = (dostime >>> 5) & 0x3f;
    var sec = ((dostime >>> 0) & 0x1f) << 1;
    return strpad_left(String(hour), '0', 2) + ':' + strpad_left(String(min), '0', 2) + ':' + strpad_left(String(sec), '0', 2);
});

var DOS_DATE_ValueRepresenter = new ValueRepresenter((dostime: number) => {
    var year = (dostime >>> 9) + 1980;
    var month = ((dostime >>> 5) & 0x0f) - 1;
    var day = (dostime >>> 0) & 0x1f;
    return strpad_left(String(day), '0', 2) + '/' + strpad_left(String(month), '0', 2) + '/' + strpad_left(String(year), '0', 4);
});

AnalyzerMapperPlugins.register('ZIP', (m:AnalyzerMapper) => {
    m.little = true;
    while (m.available > 0) {
        m.struct('entry', (node) => {
            var magic = m.str('magic', 2);
            //alert(magic);
            if (magic != 'PK') throw new Error("Not a zip file");
            var type = m.u16('type', EnumRepresenter({
                0x0201 : 'central_directory',
                0x0403 : 'local_file_header',
                0x0605 : 'end_of_central_diretory'
            }, true));
            switch (type) {
                case 0x0201:
                    node.name = 'file_header';

                    m.u16('version_used');
                    m.u16('version_extract');
                    m.u16('flags');
                    m.u16('compression_method');
                    m.u16('file_time', DOS_TIME_ValueRepresenter);
                    m.u16('file_date', DOS_DATE_ValueRepresenter);
                    m.u32('crc32', HexRepresenter);
                    var compressed_size = m.u32('compressed_size');
                    m.u32('uncompressed_size');
                    var filename_length = m.u16('filename_length');
                    var extrafield_length = m.u16('extrafield_length');
                    var comment_length = m.u16('comment_length');
                    var disk_number_start = m.u16('disk_number_start');
                    var internal_file_attributes = m.u16('internal_file_attributes');
                    var external_file_attributes = m.u32('external_file_attributes');
                    var relative_offset_local_header = m.u32('relative_offset_local_header');
                    var filename = m.str('filename', filename_length);
                    m.subs('extra', extrafield_length);
                    m.str('comment', comment_length);

                    return filename;
                    break;
                case 0x0403:
                    node.name = 'local_file_header';

                    m.u16('version_extract');
                    m.u16('flags');
                    m.u16('compression_method');
                    m.u16('file_time', DOS_TIME_ValueRepresenter);
                    m.u16('file_date', DOS_DATE_ValueRepresenter);
                    m.u32('crc32', HexRepresenter);
                    var compressed_size = m.u32('compressed_size');
                    m.u32('uncompressed_size');
                    var filename_length = m.u16('filename_length');
                    var extrafield_length = m.u16('extrafield_length');
                    var filename = m.str('filename', filename_length);
                    m.subs('extra', extrafield_length);
                    m.subs('content', compressed_size);

                    return filename;
                    break;
                case 0x0605:
                    node.name = 'end_of_central';

                    m.u16('number_of_this_disk');
                    m.u16('start_disk');
                    m.u16('total_disks');
                    m.u16('total_entries');
                    m.u32('size_central_directory');
                    m.u32('start_central');
                    var comment_length = m.u16('comment_length');
                    m.str('comment', comment_length);
                    break;
                default:
                    throw new Error("Unknown type " + type)
            }
        }, false);
    }
});